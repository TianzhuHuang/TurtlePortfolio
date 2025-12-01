import "./globals.css";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased bg-slate-950 text-slate-100 font-sans">
        <Providers>
          <div className="min-h-screen">
            <main className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
