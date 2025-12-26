# PriceFlow — Intelligent, automated price tracking and wishlist management

> Continuously monitor product prices across marketplaces and notify users when items hit target prices, enabling consistent savings and predictable budgeting.

---

## Badges

- ![Tech Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20TypeScript%20%7C%20Postgres-blue)
- ![License: MIT](https://img.shields.io/badge/License-MIT-green)
- ![Build Status](https://img.shields.io/badge/build-passing-brightgreen)

---

## Project Overview

PriceFlow solves the practical problem of fragmented shopping workflows by centralizing wishlists, continuously monitoring prices, and surfacing only meaningful alerts. Users save money and reduce cognitive load because the system programmatically verifies prices, records historical context, and alerts for real opportunities rather than noise.

---

## Screenshots

### Demo Video

[![Demo Video](https://img.youtube.com/vi/VIDEO_ID/0.jpg)](https://youtu.be/VIDEO_ID)

### Dashboard Overview

![Dashboard](./docs/screenshots/dashboard.png)
_Main dashboard with budget tracking and gift management_

### AI-Powered Gift Entry

![AI Features](./docs/screenshots/ai-features.png)
_Screenshot upload with automatic product detection and image cropping_

### Seasonal Themes

![Seasonal Themes](./docs/screenshots/seasonal-themes.png)
_Dynamic theming that changes with holidays (Christmas, Halloween, Valentine's, etc.)_

### Multi-Currency Support

![Currency Selector](./docs/screenshots/currency.png)
_Support for 20+ global currencies with auto-detection_

### Share Your Wishlist

![Email Sharing](./docs/screenshots/sharing.png)
_Share lists via email or shareable links_

---

## Key Features

### Core Features

- Track budgets in real time with visual progress indicators
- Manage gifts with structured metadata (price, recipient, priority, notes)
- Extract product metadata via AI from screenshots and product pages
- Crop and process images before saving
- Send automated price-drop alerts when items fall below target
- Create and manage multiple lists for different occasions

### Global Ready

- **20+ Currencies**: USD, EUR, GBP, KES, NGN, INR, JPY, CNY, and more
- **Auto-Detection**: Automatically detects your currency from location
- **Locale Formatting**: Proper currency symbols and formatting for each locale

### Beautiful Theming

- **8 Seasonal Themes**: Christmas, New Year, Halloween, Valentine's, Spring, Summer, Fall, Winter
- **Auto-Switching**: Themes change automatically based on current date
- **Animated Effects**: Seasonal particles (snowflakes, hearts, leaves, etc.)
- **Dark/Light Modes**: User-controlled theme preference that persists

### Sharing & Collaboration

- **Email Invitations**: Share lists via email (like Google Docs)
- **Public Links**: Generate secure, shareable links for wishlists
- **Email Notifications**: Beautiful HTML emails with share details via Resend
- **Collaborator Tracking**: See who you've shared lists with

### Enterprise-Grade Security

- **Clerk Authentication**: Industry-leading auth with social logins
- **Row-Level Security**: Users only see their own data
- **Secure Tokens**: Cryptographically secure share tokens
- **HTTPS Only**: All communications encrypted

### Developer Experience

- **TypeScript**: Full type safety across the stack
- **Server Actions**: Type-safe server functions with validation
- **Real-time Updates**: Optimistic UI updates with instant feedback
- **Modern Stack**: Next.js 15, React 19, Tailwind CSS

---

## Technical Architecture

- High-level architecture: Monolithic web app pattern with server-rendered Next.js (App Router) frontend and serverless API routes (cron, webhooks) that interact with a single authoritative Postgres store (Neon) via Drizzle ORM. Background/cron jobs are driven by Upstash QStash to keep checks serverless and event-driven.

- Design patterns and engineering choices observed:
  - Strategy-style router for scrapers (domain -> scraper implementation)
  - Cache-aside for marketplace search results (24‑hour TTL) and explicit cache invalidation
  - Exponential backoff + retry policy for external AI/API calls
  - Rate-limiter (queue + delay) to avoid hitting marketplace rate limits
  - Batch processing for AI product matching to reduce API overhead
  - Single DB pool (serverless-aware) exported as a singleton from `db/index.ts`

```mermaid
flowchart LR
  Users["Users<br/>Browser / Mobile"] --> Nextjs["Next.js<br/>(App Router)"]
  Nextjs --> API["Serverless API<br/>(cron, webhooks)"]
  API --> DB[("Neon Postgres<br/>Drizzle ORM")]
  API --> Scraper["Price Scraper & Matcher"]
  Scraper --> Market["Marketplace APIs / SerpAPI"]
  Scraper --> AI["Google Gemini<br/>(Text & Vision)"]
  Scraper -->|cache| Cache["marketplace_search_cache"]
  API --> Email["Resend (Email)"]
  Qstash["Upstash QStash"] -->|schedule| API
```

**Canonical diagrams:** Mermaid blocks above (SVG deprecated in this repo).

## Architecture Diagrams

A simplified, concise view of the system in Mermaid syntax — suitable for README rendering and quick mental models.

**Flowchart:** See condensed flow in the Technical Architecture section above.

```mermaid
sequenceDiagram
  participant Q as QStash
  participant API as /api/cron/check-prices-ai
  participant DB as Neon_Postgres
  participant SCR as Price_Scraper
  participant AI as Gemini
  participant EM as Resend

  Q->>API: trigger daily job
  API->>DB: select gifts to check
  API->>SCR: request product metadata (url)
  SCR->>Market: try marketplace selectors / APIs
  SCR-->>AI: fallback extraction (vision/text)
  AI-->>SCR: return price & metadata
  SCR->>DB: update currentPrice & price_history
  SCR->>EM: send alert if price < target
  API-->>Q: job summary / logs
```

---

## Tech Stack

### Frontend

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **Icons**: Lucide React
- **State Management**: React Server Components + Server Actions

### Backend

- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Clerk
- **Email**: Resend
- **AI**: Google Gemini (Vision + Text)

### Features & Tools

- **Image Processing**: react-easy-crop
- **Currency**: Intl.NumberFormat with 20+ currencies
- **Theming**: CSS Variables with seasonal configs
- **Deployment**: Vercel-ready

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- [Clerk account](https://clerk.com) (free tier available)
- [Neon database](https://neon.tech) (free tier available)
- [Resend API key](https://resend.com) (optional, for email sharing)
- [Google AI API key](https://makersuite.google.com/app/apikey) (optional, for AI features)

### 1. Clone and Install

```bash
git clone https://github.com/preston176/priceflow.git
cd priceflow
bun install  # or npm install
```

### 2. Environment Variables

Create a `.env` file:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Neon Database
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: AI Features (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Optional: Email Sharing (Resend)
RESEND_API_KEY=re_xxxxx
```

### 3. Database Setup

```bash
bun run db:push
```

This creates all necessary tables:

- `profiles` - User profiles
- `lists` - Gift lists
- `gifts` - Individual gifts
- `list_collaborators` - Email-based sharing
- `share_tokens` - Public share links
- `price_history` - Price tracking

### 4. Run Development Server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Engineering Decisions & Challenges

**Complex logic identified**

- **AI-augmented price extraction** (`lib/price-scraper.ts`): implemented a layered approach — deterministic CSS selection for known retailers, generic regex-based fallback, then Google Gemini (text & vision) with strict JSON output validation and retry-with-exponential-backoff.
  - **Why:** Deterministic parsing provides low-cost, high-confidence results; AI fallback handles edge cases where HTML is unpredictable. This hybrid approach maximizes extraction accuracy while bounding API usage and failure modes.

- **Marketplace search & matching** (`lib/marketplace-search.ts`, `lib/product-matcher.ts`): implemented cache-aside, rate-limiter queue, and batched AI matching with confidence thresholds to safely auto-accept matches.
  - **Why:** Caching and rate control reduce costs and make the system robust to external API outages; batched matching reduces AI requests and enables deterministic decisions (auto-accept / review / reject) based on confidence.

**Operational considerations & mitigations**

- AI call volume & cost: mitigate with caching, sampling, model choice, and usage quotas; provide graceful fallbacks to demo or cheaper extraction modes.
- Site selector drift: mitigate with monitoring, automated E2E checks, and AI/vision extraction fallbacks.
- Variant matching: capture SKU/model attributes and provide manual verification workflows for ambiguous matches.

---

## Future Improvements (Product Thinking)

1. Move cron processing to a distributed worker queue (BullMQ/Temporal) with visibility and retries to safely scale checks.
2. Integrate official marketplace APIs (Amazon PA, Walmart, BestBuy) for authoritative pricing and inventory signals.
3. Add observability (Sentry + metrics + dashboards) and cost-control alerts for AI usage and third-party API spending.

---

## Project Structure

```
priceflow/
├── app/                          # Next.js App Router
│   ├── dashboard/               # Main dashboard
│   ├── share/[token]/          # Public wishlist viewer
│   ├── api/
│   │   ├── currency/           # Currency update endpoint
│   │   └── cron/check-prices/  # Price monitoring
│   ├── sign-in/                # Auth pages
│   ├── sign-up/
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
│
├── components/                   # React Components
│   ├── ui/                      # Shadcn/UI components
│   ├── add-gift-dialog.tsx     # Gift creation modal
│   ├── crop-image-dialog.tsx   # Image cropping
│   ├── currency-selector.tsx   # Currency picker
│   ├── gift-card.tsx           # Gift display card
│   ├── header.tsx              # App header
│   ├── seasonal-particles.tsx  # Animated effects
│   ├── share-by-email-dialog.tsx # Email sharing
│   ├── theme-provider.tsx      # Theme management
│   ├── theme-toggle.tsx        # Dark/light toggle
│   └── ...
│
├── actions/                      # Server Actions
│   ├── gift-actions.ts         # Gift CRUD
│   ├── list-actions.ts         # List management
│   ├── profile-actions.ts      # User profiles
│   └── share-actions.ts        # Sharing logic
│
├── lib/                          # Utilities
│   ├── crop-image.ts           # Image cropping utils
│   ├── currency.ts             # Currency configs
│   ├── price-scraper.ts        # AI price extraction
│   ├── seasonal-theme.ts       # Theme configs
│   └── utils.ts                # Helper functions
│
├── db/                           # Database
│   ├── schema.ts               # Drizzle schema
│   └── index.ts                # DB connection
│
└── public/                       # Static assets
```

---

## Seasonal Themes

Priceflow automatically switches themes based on the calendar:

| Theme       | Dates               | Colors          | Particles                          |
| ----------- | ------------------- | --------------- | ---------------------------------- |
| Christmas   | Dec 1-25            | Red & Green     | Snowflakes, trees, stars, presents |
| New Year    | Dec 26 - Jan 5      | Purple & Gold   | Confetti, fireworks, sparkles      |
| Valentine's | Feb 1-14            | Pink & Red      | Hearts                             |
| Halloween   | Oct 15-31           | Orange & Purple | Pumpkins, ghosts, bats, spiders    |
| Spring      | Mar-May             | Green & Pink    | Flowers, butterflies               |
| Summer      | Jun-Aug             | Blue & Yellow   | Sun, waves, beach, palm trees      |
| Fall        | Sep - Oct 14        | Orange & Brown  | Leaves, acorns                     |
| Winter      | Nov, Jan 6 - Feb 28 | Blue & White    | Snowflakes, snowmen                |

---

## Available Scripts

```bash
# Development
bun run dev          # Start dev server
bun run build        # Build for production
bun run start        # Start production server
bun run lint         # Run ESLint

# Database
bun run db:generate  # Generate migrations
bun run db:push      # Push schema to database
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

---

## Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy

### Environment Variables for Production

```env
NEXT_PUBLIC_APP_URL=https://zawadi.app
# ... all other variables from .env
```

### Database Migration

For production, use migrations instead of push:

```bash
bun run db:generate  # Generate migration files
bun run db:migrate   # Apply migrations
```

---

## Security Best Practices

- All routes except `/share/*` require authentication
- Row-level security via Clerk user IDs
- Cryptographically secure share tokens
- SQL injection prevention via Drizzle ORM
- XSS protection via React's built-in escaping
- CSRF protection via Next.js Server Actions
- Environment variables never exposed to client
- Cascade deletes maintain referential integrity

---

## Feature Roadmap

### v1.2.0 (Planned)

- Mobile app (React Native)
- Price drop notifications via email
- Receipt scanning with OCR
- Gift recommendations based on recipient

### v1.3.0 (Planned)

- Family/group gift coordination
- "Who's buying what" tracker to avoid duplicate gifts
- Integration with Amazon/Walmart APIs for real-time pricing
- Budget analytics and spending insights

### Future Ideas

- Voice-powered gift entry (Alexa/Google Home)
- Browser extension for one-click gift saving
- Social features (gift exchange groups)
- Sustainability score for eco-friendly gifts

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [Shadcn/UI](https://ui.shadcn.com)
- Authentication by [Clerk](https://clerk.com)
- Database by [Neon](https://neon.tech)
- Email by [Resend](https://resend.com)
- AI by [Google Gemini](https://ai.google.dev)

---

## Support

- Website: [priceflow.prestonmayieka.com](https://priceflow.prestonmayieka.com/)
- Issues: [GitHub Issues](https://github.com/preston176/priceflow/issues)
- Discussions: [GitHub Discussions](https://github.com/preston176/priceflow/discussions)

---
