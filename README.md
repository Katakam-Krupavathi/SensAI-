# SensAI — AI-Powered Career Coach

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat&logo=prisma)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat&logo=postgresql)](https://neon.tech/)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat&logo=clerk)](https://clerk.com/)
[![Author](https://img.shields.io/badge/Author-Katakam--Krupavathi-orange?style=flat&logo=github)](https://github.com/Katakam-Krupavathi)

> **Architected & Developed by Katakam Krupavathi**  
> GitHub: [@Katakam-Krupavathi](https://github.com/Katakam-Krupavathi) &bull; Email: [krupavathikatakam2006@gmail.com](mailto:krupavathikatakam2006@gmail.com)

SensAI is an intelligent, full-stack AI career acceleration platform built with Next.js 15, Google Gemini AI, Prisma ORM, PostgreSQL, Clerk Authentication, and Inngest. It empowers job seekers and professionals with personalized career coaching, dynamic industry insights, AI resume building with ATS scoring, tailored cover letter generation, and interactive mock interview preparation.

---

## 📑 Table of Contents

- [System Architecture](#-system-architecture)
- [Sequence Diagrams & Workflows](#-sequence-diagrams--workflows)
  - [1. User Authentication & Onboarding](#1-user-authentication--onboarding)
  - [2. AI Resume Builder & ATS Scoring](#2-ai-resume-builder--ats-scoring)
  - [3. Interactive AI Mock Interview](#3-interactive-ai-mock-interview)
  - [4. Automated Background Industry Insights](#4-automated-background-industry-insights)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [Getting Started](#-getting-started)
- [Author & Maintainer](#-author--maintainer)

---

## 🏛 System Architecture

```mermaid
graph TD
    subgraph Client ["Client Layer (Next.js 15 App Router)"]
        UI[Interactive UI Components / Radix UI / Tailwind CSS]
        Dash[Industry Insights Dashboard]
        Resume[Resume Builder & PDF Exporter]
        Cover[AI Cover Letter Generator]
        Interview[Mock Interview & Quiz Arena]
    end

    subgraph Auth ["Authentication & Identity"]
        Clerk[Clerk Auth & Session Management]
    end

    subgraph Server ["Server & Action Layer"]
        SA[Server Actions with Strict Auth Verification]
        Helper[Schema Validation & Error Handlers]
    end

    subgraph AI ["AI Processing Layer"]
        Gemini[Google Gemini 1.5 Flash Model]
    end

    subgraph Background ["Background Workflows & Cron"]
        Inngest[Inngest Background Job Engine]
    end

    subgraph Database ["Persistence Layer"]
        Prisma[Prisma ORM Client]
        Postgres[(PostgreSQL Database)]
    end

    UI --> Clerk
    Dash --> SA
    Resume --> SA
    Cover --> SA
    Interview --> SA

    SA --> Clerk
    SA --> Gemini
    SA --> Prisma
    Inngest --> Gemini
    Inngest --> Prisma
    Prisma --> Postgres
```

---

## 🔄 Sequence Diagrams & Workflows

### 1. User Authentication & Onboarding

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Clerk as Clerk Auth
    participant App as SensAI App Router
    participant Server as Server Actions
    participant DB as PostgreSQL (Prisma)

    User->>Clerk: Sign In / Sign Up
    Clerk-->>User: Issue Session JWT
    User->>App: Access Protected Route
    App->>Server: checkUser()
    Server->>Clerk: Validate userId & fetch user profile
    alt User exists in DB
        Server->>DB: Fetch user profile & industry
    else New User
        Server->>DB: Provision User record in PostgreSQL
    end
    DB-->>Server: Return User Profile
    Server-->>App: Render Dashboard / Onboarding
```

### 2. AI Resume Builder & ATS Scoring

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Resume Builder View
    participant Action as actions/resume.js
    participant Gemini as Google Gemini AI
    participant DB as PostgreSQL (Prisma)

    User->>App: Input Experience, Skills, Bio, & Projects
    App->>Action: saveResume(content)
    Action->>Action: Verify Clerk userId
    Action->>Gemini: Prompt for ATS Optimization & Feedback
    Gemini-->>Action: Return ATS Score, Strengths, & Recommendations
    Action->>DB: Upsert Resume record (content, atsScore, feedback)
    DB-->>Action: Saved Resume Entity
    Action-->>App: Updated Resume & ATS Analytics
    App-->>User: Display Formatted Markdown & PDF Export Option
```

### 3. Interactive AI Mock Interview

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant QuizUI as Interview Quiz Component
    participant Action as actions/interview.js
    participant Gemini as Google Gemini AI
    participant DB as PostgreSQL (Prisma)

    User->>QuizUI: Start Technical/Behavioral Interview
    QuizUI->>Action: generateQuiz()
    Action->>Action: Verify Clerk userId & user industry/skills
    Action->>Gemini: Generate role-specific questions & answers
    Gemini-->>Action: 10 curated questions + explanations
    Action-->>QuizUI: Render Quiz Step-by-Step
    User->>QuizUI: Submit Answers
    QuizUI->>Action: saveQuizResult(questions, score)
    Action->>Gemini: Request actionable improvement tip
    Gemini-->>Action: Improvement summary
    Action->>DB: Save Assessment Record
    DB-->>Action: Assessment saved
    Action-->>QuizUI: Performance analytics & Review Breakdown
```

### 4. Automated Background Industry Insights

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Inngest Cron (Weekly)
    participant Inngest as Inngest Step Runner
    participant Gemini as Google Gemini AI
    participant DB as PostgreSQL (Prisma)

    Cron->>Inngest: Trigger generateIndustryInsights function
    Inngest->>DB: Fetch all tracked industries
    DB-->>Inngest: Return distinct industries
    loop For each industry
        Inngest->>Gemini: Prompt industry trends, salary data, demand & top skills
        Gemini-->>Inngest: Structured JSON payload
        Inngest->>DB: Update IndustryInsight record (lastUpdated, nextUpdate)
    end
    Inngest-->>Cron: Pipeline Completed Successfully
```

---

## 🚀 Key Features

- 🎯 **AI-Powered Industry Insights**: Real-time salary distributions, growth rates, market outlook, and high-demand skill heatmaps updated automatically.
- 📝 **Smart Resume Builder & ATS Analyzer**: Markdown-supported resume composer with automated ATS compatibility scoring, role-fit suggestions, and PDF generation.
- ✉️ **Tailored Cover Letter Generator**: Generate highly personalized cover letters aligned with target job descriptions and company backgrounds.
- 🎓 **Interactive Mock Interviews**: Dynamic technical & behavioral quiz engine with instant evaluation, score distributions, and AI improvement tips.
- 🔒 **Enterprise-Grade Security**: Strict Clerk user authentication with multi-factor support, authenticated server actions, and protected API routes.
- ⚡ **Automated Background Workflows**: Inngest-powered recurring cron pipelines ensuring up-to-date market intelligence with zero manual maintenance.

---

## 💻 Tech Stack

| Domain | Technology |
|---|---|
| **Framework** | [Next.js 15 (App Router, Server Actions)](https://nextjs.org/) |
| **Language** | [JavaScript / React 19](https://react.dev/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **Artificial Intelligence** | [Google Gemini AI (1.5 Flash)](https://ai.google.dev/) |
| **Database & ORM** | [PostgreSQL (Neon)](https://neon.tech/), [Prisma ORM](https://www.prisma.io/) |
| **Authentication** | [Clerk Authentication](https://clerk.com/) |
| **Background Jobs** | [Inngest Workflow Engine](https://www.inngest.com/) |
| **Charts & Visualization** | [Recharts](https://recharts.org/) |
| **Form Handling** | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) |

---

## 📂 Project Structure

```text
SensAI/
├── actions/                  # Next.js Server Actions (Authenticated)
│   ├── cover-letter.js       # Cover letter generation & management
│   ├── dashboard.js          # Industry insights data fetchers
│   ├── interview.js          # Interview generation & quiz evaluation
│   ├── resume.js             # Resume saving & ATS score calculation
│   └── user.js               # User onboarding & profile management
├── app/                      # Next.js App Router
│   ├── (auth)/               # Clerk Sign-in & Sign-up pages
│   ├── (main)/               # Core authenticated application views
│   │   ├── ai-cover-letter/  # Cover letter generator & preview
│   │   ├── dashboard/        # Industry trends & market analytics
│   │   ├── interview/        # Mock interview simulator & history
│   │   ├── onboarding/       # Industry & profile setup form
│   │   └── resume/           # Resume editor & ATS evaluator
│   ├── api/inngest/          # Inngest webhook route handler
│   ├── globals.css           # Global Tailwind CSS styles
│   ├── layout.js             # Root layout with Clerk & Theme Provider
│   └── page.js               # Landing page
├── components/               # Reusable React components & UI primitives
│   ├── ui/                   # Radix UI wrapper components
│   ├── header.jsx            # Application navigation bar
│   ├── hero.jsx              # Landing hero section
│   └── theme-provider.jsx    # Dark/Light mode theme provider
├── data/                     # Static configuration & landing page datasets
├── hooks/                    # Custom React hooks (e.g. use-fetch)
├── lib/                      # Core utilities & singleton clients
│   ├── inngest/              # Inngest client & scheduled functions
│   ├── checkUser.js          # Authenticated user sync helper
│   ├── prisma.js             # Prisma ORM singleton client
│   └── utils.js              # Class merger utilities
├── prisma/                   # Prisma schema & migration files
│   └── schema.prisma         # PostgreSQL data models
├── public/                   # Static assets & illustrations
├── package.json              # Project dependencies & scripts
└── README.md                 # Architecture documentation
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory and configure the following variables:

```env
# Database (PostgreSQL / Neon)
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/onboarding"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/onboarding"

# Google Gemini AI
GEMINI_API_KEY="your_gemini_api_key_here"

# Inngest (Background Workflow Engine)
INNGEST_EVENT_KEY="your_inngest_event_key"
INNGEST_SIGNING_KEY="your_inngest_signing_key"
```

---

## 🛠 Getting Started

### Prerequisites

- **Node.js**: `v18.18.0` or higher
- **npm** or **yarn** / **pnpm**
- **PostgreSQL Database** (e.g., Neon Postgres)
- **Clerk & Google Gemini API Keys**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Katakam-Krupavathi/SensAI.git
   cd SensAI
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Generate Prisma Client & Apply Migrations**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Start Inngest Dev Server (Optional for local cron jobs)**:
   ```bash
   npx inngest-cli@latest dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the platform.

---

## 👤 Author & Maintainer

**Katakam Krupavathi**  
- GitHub: [@Katakam-Krupavathi](https://github.com/Katakam-Krupavathi)  
- Email: [krupavathikatakam2006@gmail.com](mailto:krupavathikatakam2006@gmail.com)
