# Turtle Portfolio Frontend

This is a React project built with Vite, migrated from Next.js.

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env` file in the root of the frontend directory with the following content:

```
VITE_API_BASE_URL=http://localhost:8000/api
```

For production builds, the app will use `/api` as the base URL.

## Building for Production

To build the app for production, run:

```bash
npm run build
```

The build output will be in the `dist` directory, which can be deployed to any static hosting service.

## Deployment

This React + Vite app can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- Traditional web servers

Just serve the contents of the `dist` directory after building.