from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional, TypedDict

import numpy as np
from PIL import Image, ImageEnhance, ImageOps
from loguru import logger


class ParsedHolding(TypedDict, total=False):
    name: str
    symbol: str
    quantity: float
    cost_price: float
    market_value: float


def parse_account_screenshot(image_path: Path) -> List[ParsedHolding]:
    """
    Parse holdings information from a screenshot.

    The implementation attempts to use PaddleOCR. If it is not available,
    the function will log the issue and raise a RuntimeError so that the
    caller can fall back to manual data entry.
    """
    try:
        from paddleocr import PaddleOCR  # type: ignore
    except ImportError as exc:  # pragma: no cover - optional dependency
        raise RuntimeError(
            "paddleocr is not installed. Install it or configure another OCR provider."
        ) from exc

    ocr = PaddleOCR(
        use_angle_cls=True,
        lang="ch",
        det_limit_side_len=1920,
        det_limit_type="max",
        image_orientation=True,
        det_db_thresh=0.15,
        det_db_box_thresh=0.25,
        det_db_unclip_ratio=1.8,
    )
    image = Image.open(image_path).convert("RGB")
    width, height = image.size
    scale_factor = 1.0
    target_min_side = 2200
    min_side = min(width, height)
    if min_side < target_min_side:
        scale_factor = target_min_side / float(min_side)
        new_size = (int(width * scale_factor), int(height * scale_factor))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
    image = ImageOps.autocontrast(image)
    image = ImageOps.equalize(image)
    image = ImageEnhance.Contrast(image).enhance(1.35)
    image_np = np.array(image)
    result = ocr.ocr(image_np, cls=True)

    tokens: List[Dict[str, float | str]] = []
    for page in result:
        if not page:
            continue
        for bbox, (text, _score) in page:
            cleaned = text.strip()
            if not cleaned:
                continue
            cx = sum(point[0] for point in bbox) / 4
            cy = sum(point[1] for point in bbox) / 4
            tokens.append({"text": cleaned, "cx": cx, "cy": cy})

    if not tokens:
        logger.warning("OCR returned no tokens for %s", image_path)
        return []

    header_tokens = {
        "value": _find_token(tokens, ("市值",)),
        "profit": _find_token(tokens, ("盈亏",)),
        "volume": _find_token(tokens, ("持仓", "可用")),
        "cost": _find_token(tokens, ("成本", "现价")),
    }
    header_positions = {
        key: token["cx"] for key, token in header_tokens.items() if token is not None
    }

    if not header_positions:
        logger.warning("Unable to locate table header in screenshot %s", image_path)
        return []

    header_y = min(token["cy"] for token in header_tokens.values() if token)
    row_tokens = [
        token for token in tokens if token["cy"] > header_y + 20
    ]
    row_tokens.sort(key=lambda item: item["cy"])

    rows: List[List[Dict[str, float | str]]] = []
    current_row: List[Dict[str, float | str]] = []
    last_cy: Optional[float] = None
    for token in row_tokens:
        cy = float(token["cy"])
        if last_cy is None or abs(cy - last_cy) <= 25:
            current_row.append(token)
        else:
            rows.append(current_row)
            current_row = [token]
        last_cy = cy
    if current_row:
        rows.append(current_row)

    holdings: List[ParsedHolding] = []
    name_boundary = min(header_positions.values())

    start_index = 0
    for idx, row in enumerate(rows):
        if any("持仓股" in str(token["text"]) for token in row):
            start_index = idx + 1
            break
    data_rows = [
        row
        for row in rows[start_index:]
        if any(_contains_digit(str(token["text"])) for token in row)
    ]

    for index in range(0, len(data_rows), 2):
        upper = data_rows[index]
        lower = data_rows[index + 1] if index + 1 < len(data_rows) else []

        name = _extract_name(upper, name_boundary)
        value_tokens = _collect_by_column(lower or upper, "value", header_positions)
        volume_tokens = _collect_by_column(upper, "volume", header_positions)
        if not volume_tokens:
            volume_tokens = _collect_by_column(lower, "volume", header_positions)
        cost_tokens = _collect_by_column(upper, "cost", header_positions)
        if not cost_tokens:
            cost_tokens = _collect_by_column(lower, "cost", header_positions)

        market_value = _extract_number(value_tokens)
        quantity = _extract_number(volume_tokens)
        if quantity is None:
            quantity = _extract_number(cost_tokens, prefer="first")
        cost_price = _extract_number(cost_tokens, prefer="last")

        if name and market_value is not None:
            holdings.append(
                {
                    "name": name,
                    "symbol": name,
                    "market_value": market_value,
                    "quantity": quantity if quantity is not None else 0.0,
                    "cost_price": cost_price,
                }
            )

    logger.info(
        "Parsed %s holdings from screenshot %s: %s",
        len(holdings),
        image_path.name,
        [holding["name"] for holding in holdings],
    )
    return holdings


def _find_token(
    tokens: List[Dict[str, float | str]], keywords: tuple[str, ...]
) -> Optional[Dict[str, float | str]]:
    for token in tokens:
        text = str(token["text"])
        if any(keyword in text for keyword in keywords):
            return token
    return None


def _is_numeric_string(text: str) -> bool:
    stripped = (
        text.replace(",", "")
        .replace(".", "")
        .replace("-", "")
        .replace("%", "")
        .replace("HK$", "")
        .replace("HKS$", "")
        .replace("HHK$", "")
        .replace("¥", "")
        .strip()
    )
    return stripped.isdigit()


def _extract_number(texts: List[str], prefer: str = "first") -> Optional[float]:
    import re

    if not texts:
        return None
    if prefer not in {"first", "last"}:
        prefer = "first"
    ordered = texts if prefer == "first" else list(reversed(texts))
    for text in ordered:
        cleaned = text.replace(",", "")
        match = re.findall(r"-?\d+(?:\.\d+)?", cleaned)
        if match:
            try:
                target = match[0] if prefer == "first" else match[-1]
                return float(target)
            except ValueError:
                continue
    return None


def _collect_by_column(
    row: List[Dict[str, float | str]],
    column: str,
    header_positions: Dict[str, float],
) -> List[str]:
    if column not in header_positions:
        return []
    collected: List[str] = []
    for token in row:
        cx = float(token["cx"])
        target = min(
            header_positions.items(), key=lambda item: abs(item[1] - cx)
        )[0]
        if target == column:
            collected.append(str(token["text"]))
    return collected


def _extract_name(
    row: List[Dict[str, float | str]],
    name_boundary: float,
) -> Optional[str]:
    parts: List[str] = []
    encountered_numeric = False
    for token in sorted(row, key=lambda item: item["cx"]):
        text = str(token["text"])
        if _contains_digit(text):
            encountered_numeric = True
            continue
        if encountered_numeric:
            continue
        if len(text) <= 1:
            continue
        if float(token["cx"]) > name_boundary + 180:
            continue
        parts.append(text)
    return _normalize_name(parts)


def _contains_digit(text: str) -> bool:
    return any(char.isdigit() for char in text)


def _normalize_name(parts: List[str]) -> Optional[str]:
    meaningful = [
        part
        for part in parts
        if part and len(part) > 1 and not _is_numeric_string(part)
    ]
    if not meaningful:
        return None
    return "".join(meaningful).strip()

