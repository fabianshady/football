# 🐆 ITJAGUARS FC Stats

A real-time football statistics dashboard for **ITJAGUARS FC** — built with Next.js, Prisma, and PostgreSQL.

Live site: [itjaguars.fabianms.com](https://itjaguars.fabianms.com)

---

## ✨ Features

- **Match tracking** — upcoming fixtures and full results history
- **Team stats** — wins, draws, losses, goals for/against, win rate
- **Top scorers** — ranked goal table with per-player chart
- **Monthly trends** — goals scored vs. conceded over the last 6 months
- **Debt tracker** — outstanding payments per player across all events
- **Multi-club support** — switch between different clubs registered in the system
- **Dark mode UI** — Tailwind CSS + Radix UI with a gradient dark theme
- **Auto-refresh** — pages revalidate every 60 seconds

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router, standalone output) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | [Prisma](https://www.prisma.io/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/) |
| Charts | [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Container | Docker (multi-stage build) |

---

## 📐 Data Model

```
Player      – name, dorsal, positions[], active
Match       – myTeam, rivalTeam, date, location, scores
Goal        – match, player, minute (optional)
MatchSquad  – match ↔ player (players called up)
Event       – name, cost, date  (training, tournament fees, etc.)
Payment     – player ↔ event, paid flag
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/fabianshady/football.git
cd football
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Create a `.env` file at the project root:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
```

### 4. Apply the database schema

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Generate Prisma client and build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## 🐳 Docker Deployment

The project ships with a production-ready multi-stage Dockerfile.

### Build the image

```bash
docker build -t itjaguars-fc .
```

### Run the container

```bash
docker run -p 3001:3001 \
  -e DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE" \
  itjaguars-fc
```

The app listens on port **3001** by default.

> **Note:** The Docker image uses Alpine Linux with OpenSSL for Prisma compatibility, and runs as a non-root user (`nextjs`) for security.

---

## 📁 Project Structure

```
.
├── app/                  # Next.js App Router pages and layout
│   ├── layout.tsx        # Root layout with metadata and fonts
│   └── page.tsx          # Home page — fetches stats and renders dashboard
├── components/           # Reusable UI components
│   ├── charts/           # Chart.js chart wrappers
│   ├── club-tabs.tsx     # Main tabbed dashboard (matches, scorers, stats, debts)
│   ├── match-card.tsx    # Single match card
│   ├── matches-history.tsx
│   ├── stat-card.tsx
│   └── ui/               # Shadcn-style primitive components
├── lib/
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Shared utility functions
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets (logo, preview image, etc.)
├── Dockerfile
└── next.config.js
```

---

## 🌐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |

---

## 📄 License

This project is private and maintained by [fabianshady](https://github.com/fabianshady).
