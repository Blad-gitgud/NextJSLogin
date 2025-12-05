# MyProject — Next.js Login & Dashboard

A secure Next.js application with authentication, registration, and position management. Features glass-morphism UI, server-side auth proxying, and production-ready security headers.

## Features

- 🔐 **Secure Authentication**: Token-based login/register with backend proxy.
- 🎨 **Glass-Morphism UI**: Modern, responsive design with Tailwind CSS.
- 📊 **Dashboard**: Authenticated dashboard with positions management (CRUD).
- ⚡ **Optimized**: Server-side proxy routes, retry logic for slow backends, HTTP-only cookie support.
- 🛡️ **Security Headers**: CSP, X-Frame-Options, HSTS, and more.

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, Tailwind CSS, shadcn/ui
- **Auth**: JWT tokens with HTTP-only cookie support (via backend)
- **API**: Next.js API routes (proxy to backend)
- **Styling**: Tailwind CSS + Glass-morphism effects

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A backend auth server (see `.env.example`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/my-project.git
   cd my-project
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the values (especially `NEXTAUTH_SECRET` and backend URLs)
4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
