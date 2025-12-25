# Zawadi - Smart Holiday Gift Tracker

> **Zawadi** (Swahili for "gift") - Your intelligent companion for stress-free holiday shopping and gift management.

A production-ready SaaS application for tracking holiday budgets, managing gift wishlists, and making gift-giving joyful again. Built with modern technologies and designed for real-world use.

## The Story Behind Zawadi

It was a cold December evening, and I was stuck in bumper-to-bumper traffic on my way home from work. The holiday season was in full swing, and like everyone else, I was stressed about gift shopping. As I sat there, watching the brake lights ahead, I pulled out my phone to check my gift list—scattered across a Notes app, a Google Doc, and some random screenshots I'd sent myself.

That's when it hit me.

*Why is this so complicated?*

I had a budget I was trying to stick to, but I had no idea how much I'd actually spent versus how much I had left. I'd saved links to products I wanted to buy, but some were on sale now and I had no way to track that. My family kept asking what I wanted for Christmas, but sharing my wishlist meant copy-pasting a messy note that would be outdated by tomorrow.

Right there, in that traffic jam, I sketched out Zawadi on my phone. A simple, beautiful tool that would:
- Track my budget in real-time
- Organize all my gift ideas in one place
- Alert me when prices drop on items I'm watching
- Let me share my wishlist with one link—no more awkward text threads
- Work seamlessly across all my devices

By the time traffic cleared, I had the core concept. That weekend, I started building.

Zawadi isn't just another budget app—it's the tool I needed when I was overwhelmed by holiday chaos. It's for everyone who's ever felt stressed trying to juggle spreadsheets, notes, and screenshots while keeping their spending under control.

Now, instead of dreading the holidays, I actually enjoy the gift-giving process. And I hope Zawadi does the same for you.

**— Built during holiday traffic**

---

## Screenshots

> Coming soon - Screenshots and demo videos will be added here

### Dashboard Overview
![Dashboard](./docs/screenshots/dashboard.png)
*Main dashboard with budget tracking and gift management*

### AI-Powered Gift Entry
![AI Features](./docs/screenshots/ai-features.png)
*Screenshot upload with automatic product detection and image cropping*

### Seasonal Themes
![Seasonal Themes](./docs/screenshots/seasonal-themes.png)
*Dynamic theming that changes with holidays (Christmas, Halloween, Valentine's, etc.)*

### Multi-Currency Support
![Currency Selector](./docs/screenshots/currency.png)
*Support for 20+ global currencies with auto-detection*

### Share Your Wishlist
![Email Sharing](./docs/screenshots/sharing.png)
*Share lists via email or shareable links*

---

## Features

### Core Features
- **Smart Budget Tracking**: Real-time budget monitoring with visual progress indicators
- **Intelligent Gift Management**: Add, edit, organize gifts with details like price, recipient, priority, and notes
- **AI-Powered Entry**: Upload product screenshots and let AI extract name, price, and image
- **Image Cropping**: Crop and adjust product images before saving
- **Savings Alerts**: Automatic notifications when current price drops below target
- **Multi-List Support**: Create separate lists for different occasions (Christmas, Birthdays, etc.)

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
git clone https://github.com/yourusername/zawadi.git
cd zawadi
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

## Project Structure

```
zawadi/
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

Zawadi automatically switches themes based on the calendar:

| Theme | Dates | Colors | Particles |
|-------|-------|--------|-----------|
| Christmas | Dec 1-25 | Red & Green | Snowflakes, trees, stars, presents |
| New Year | Dec 26 - Jan 5 | Purple & Gold | Confetti, fireworks, sparkles |
| Valentine's | Feb 1-14 | Pink & Red | Hearts |
| Halloween | Oct 15-31 | Orange & Purple | Pumpkins, ghosts, bats, spiders |
| Spring | Mar-May | Green & Pink | Flowers, butterflies |
| Summer | Jun-Aug | Blue & Yellow | Sun, waves, beach, palm trees |
| Fall | Sep - Oct 14 | Orange & Brown | Leaves, acorns |
| Winter | Nov, Jan 6 - Feb 28 | Blue & White | Snowflakes, snowmen |

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

- Website: [zawadi.app](https://zawadi.app)
- Issues: [GitHub Issues](https://github.com/yourusername/zawadi/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/zawadi/discussions)

---
