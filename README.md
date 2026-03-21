# Portfolio V2

A modern, full-stack developer portfolio built with Next.js, TypeScript, and AWS.

Live: [asakurayuta.dev](https://asakurayuta.dev)

---

## Tech Stack

| Layer            | Technology                                                           |
| ---------------- | -------------------------------------------------------------------- |
| Framework        | Next.js 16 (App Router, Server Components, ISR)                      |
| Language         | TypeScript 5                                                         |
| Database         | Neon (Serverless PostgreSQL)                                         |
| ORM              | Prisma 7 with `@prisma/adapter-neon`                                 |
| Hosting          | AWS Amplify                                                          |
| Storage          | AWS S3                                                               |
| CDN              | AWS CloudFront                                                       |
| Auth             | AWS Cognito + jose (JWT)                                             |
| Email            | AWS SES                                                              |
| Styling          | Tailwind CSS 4                                                       |
| UI Components    | Radix UI via shadcn, CVA + clsx + tailwind-merge                     |
| Image Processing | Sharp (WebP conversion, multi-variant pipeline)                      |
| Forms            | react-hook-form + @hookform/resolvers + Zod 4                        |
| Server State     | TanStack React Query                                                 |
| Client State     | Zustand                                                              |
| Markdown         | remark + rehype pipeline (remark-gfm, rehype-highlight, rehype-slug) |
| Notifications    | Sonner                                                               |
| Theming          | next-themes                                                          |

---

## Features

**Public**

- Server-rendered pages with ISR caching
- Project portfolio with filtering
- Blog with full Markdown rendering (GFM, syntax highlighting, slug anchors)
- Contact form with AWS SES email notifications
- Dynamic Open Graph images for blog posts and projects
- XML sitemap and robots.txt
- Structured data (JSON-LD)
- Responsive design across all devices

**Admin CMS** (authenticated)

- Full CRUD for projects, blog posts, skills, experience, and site settings
- Image upload pipeline: Sharp resizes and converts to WebP, stored in S3 with CloudFront delivery
- Markdown editor with live preview
- Certification management

---

## Project Structure

```
src/
  app/
    (public)/       # Public-facing pages and layouts
    (admin)/        # Admin CMS pages (authenticated)
    api/            # API route handlers
  components/
    public/         # Public UI components
    admin/          # Admin UI components
    ui/             # Shared shadcn primitives
  lib/              # Utilities, auth, S3, SES, Prisma client
prisma/
  schema.prisma     # Database schema
  migrations/       # Migration history
docs/               # Sprint implementation guides
public/             # Static assets
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A Neon database (or any PostgreSQL instance)
- AWS account with S3, CloudFront, Cognito, and SES configured

### Install

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

See `.env.example` for all required variables (database URL, AWS credentials, Cognito config, SES config, etc.).

### Database Setup

```bash
npm run prisma:generate
npm run prisma:migrate:dev
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command                      | Description                      |
| ---------------------------- | -------------------------------- |
| `npm run dev`                | Start development server         |
| `npm run build`              | Production build                 |
| `npm run lint`               | Run ESLint                       |
| `npx tsc --noEmit`           | Type check                       |
| `npm test`                   | Run test suite                   |
| `npm run prisma:generate`    | Regenerate Prisma client         |
| `npm run prisma:migrate:dev` | Create and apply a new migration |
| `npm run prisma:studio`      | Open Prisma Studio               |

---

## Deployment

Deployed on **AWS Amplify**. The build pipeline is defined in [`amplify.yml`](amplify.yml):

- Injects environment variables into `.env.production` at build time
- Runs `prisma generate` and `prisma migrate deploy`
- Builds the Next.js app

Security response headers (HSTS, CSP, X-Frame-Options, etc.) are configured in [`customHttp.yml`](customHttp.yml) and applied by Amplify to all responses.

---

## Architecture Notes

**Image Pipeline**

- Uploads are processed by Sharp: resized, stripped of metadata, and converted to WebP
- Stored in S3 with the key pattern: `{folder}/{entityId}/{variant}_{fileId}.webp`
- Served via CloudFront CDN

**ISR Caching**

- Public pages use `revalidate` tags for on-demand ISR
- Admin mutations call `revalidateTag` to purge stale cache

**Auth**

- Admin routes are protected by `requireAuth` middleware (jose JWT verification)
- Tokens are issued after Cognito authentication

---

## License

Private — All rights reserved.
