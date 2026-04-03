# 🏌️‍♂️ GolfSub

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com/)

> **GolfSub** is a premium golf subscription platform that bridges the gap between game improvement and charitable impact. Subscribers track their progress, support great causes, and enter exclusive monthly draws with verified fairness.

---

## ✨ Key Features

### 📊 Performance Tracking
- **Smart Score Ledger**: Log your rounds through a sleek, intuitive interface.
- **Dynamic Handicapping**: Automatically maintains a rolling average of your last 5 scores to keep your stats current.

### 🎗️ Charitable Impact
- **Subscription-Driven Giving**: A dedicated percentage of every subscription (default: 10%) goes directly to a charity of your choice.
- **Track Your Impact**: Real-time dashboard to see how your contribution is making a difference.

### 🏆 Exclusive Draws
- **3/4/5 Logic**: A unique draw system where matching 3, 4, or 5 numbers unlocks escalating cash prizes from the verified pool.
- **Verified Fairness**: All draws are executed via tamper-proof PostgreSQL functions, ensuring complete transparency and security.

### 🔐 Secure & Seamless
- **Robust Authentication**: Powered by NextAuth.js (Auth.js v5) with secure session management.
- **Global Payments**: Seamless subscription handling and secure checkouts via Stripe.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
- **Backend / Database**: [Supabase](https://supabase.com/) (PostgreSQL + RLS)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Payments**: [Stripe SDK](https://stripe.com/docs/sdk)
- **Deployment**: [Vercel](https://vercel.com/) (Recommended)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.17+ 
- npm / pnpm / yarn
- A Supabase account and project
- A Stripe developer account

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vanshsuri07/Golf-Subscription.git
   cd Golf-Subscription
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add the following:

   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   DATABASE_URL=your_postgresql_connection_string

   # Authentication
   AUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   STRIPE_PRO_PRICE_ID=price_...
   STRIPE_YEARLY_PRICE_ID=price_...

   # Platform Settings
   CHARITY_PERCENTAGE=10
   DRAW_INTERVAL_DAYS=7
   ```

4. **Database Migration:**
   Apply the database schema and seed initial data:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🏗️ Project Structure

```text
├── src/
│   ├── app/            # Next.js App Router (Pages & API Routes)
│   ├── components/     # Reusable UI & Layout components
│   ├── lib/            # Shared utilities and design tokens
│   └── types/          # TypeScript definitions
├── supabase/           # Database migrations and seed data
├── scripts/            # Database management scripts
└── public/             # Static assets
```

---

## 📜 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an issue.

---

*Built with ❤️ for the Golf Community.*
