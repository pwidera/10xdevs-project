# 10xFlashAI

[![version](https://img.shields.io/badge/version-0.0.1-blue)](./package.json) [![node](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white)](./.nvmrc)

## Table of Contents
- [1. Project name](#1-project-name)
- [2. Project description](#2-project-description)
- [3. Tech stack](#3-tech-stack)
- [4. Getting started locally](#4-getting-started-locally)
- [5. Available scripts](#5-available-scripts)
- [6. Project scope](#6-project-scope)
- [7. Project status](#7-project-status)
- [8. License](#8-license)

## 1. Project name
10xFlashAI

## 2. Project description
10xFlashAIs is an AI-assisted flashcards app that helps you rapidly create and study high‑quality Q&A cards.

Core capabilities (MVP):
- Generate up to 20 Q&A flashcard proposals from a pasted text (100–10,000 chars), in Polish or English. Accept or reject individually, or use bulk accept/reject. Only accepted cards are saved.
- Manually add flashcards with validation (front/back up to 1000 chars), edit saved cards inline, search by front and back, and delete cards.
- User accounts with registration, login, password change, and account deletion (with associated cards), ensuring per‑user privacy.
- Simple study sessions: review 5 cards at a time, click to reveal the answer, navigate previous/next. Minimal spaced‑repetition fields (e.g., last_reviewed_at) guide scheduling, prioritizing the oldest reviewed items.
- Analytics: record number of generated proposals, number of acceptances, and acceptance rate per generation session.

References:
- Product Requirements: .ai/prd.md
- Tech Stack: .ai/tech-stack.md

## 3. Tech stack
- Frontend: Astro 5 + React 19, TypeScript 5, Tailwind CSS 4, shadcn/ui
- Backend: Supabase (PostgreSQL, Auth, SDKs)
- AI: OpenRouter.ai (access to multiple LLM providers with budgeting controls)
- CI/CD & Hosting: GitHub Actions; DigitalOcean via Docker

Key runtime dependencies (see package.json for full list):
- astro ^5.13.7, @astrojs/react, @astrojs/node, @astrojs/sitemap
- react ^19.1.1, react-dom ^19.1.1, @types/react, @types/react-dom
- tailwindcss ^4.1.13, @tailwindcss/vite, tailwind-merge, class-variance-authority, clsx
- lucide-react, @radix-ui/react-slot, tw-animate-css

Tooling:
- ESLint 9, Prettier (+ prettier-plugin-astro), TypeScript ESLint 8, eslint-plugin-astro, eslint-plugin-react(+hooks+compiler beta), import resolver
- Husky + lint-staged

## 4. Getting started locally
Prerequisites:
- Node.js 22.14.0 (see .nvmrc)
- npm (bundled with Node.js)

Setup:
1) Use the correct Node version
```bash
nvm use
```
2) Install dependencies
```bash
npm install
```
3) Configure environment variables (create .env or .env.local)
```bash
# OpenRouter (LLM access)
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase (Backend)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```
4) Start the dev server
```bash
npm run dev
```
5) Build and preview production
```bash
npm run build
npm run preview
```

## 5. Available scripts
- dev: Start the Astro dev server
- build: Build the production site
- preview: Preview the production build locally
- astro: Run the Astro CLI directly
- lint: Run ESLint
- lint:fix: Run ESLint with auto-fix
- format: Run Prettier write across the repo

## 6. Project scope
In scope (MVP):
- AI generation from pasted text (100–10,000 chars), up to 20 Q&A proposals, accept/reject individually and in bulk; only accepted saved
- Manual flashcard creation (Q&A up to 1000 chars), validation; inline edit saved cards
- List, search (front and back), and delete cards
- Authentication: register, login, change password, delete account; minimal data: email + password; secure per‑user access
- Learning sessions: 5 cards per page, reveal back on click, previous/next navigation; minimal spaced‑repetition fields (e.g., last_reviewed_at); selection by oldest reviewed first
- Analytics: proposals count, acceptances, acceptance rate per generation session; no storage of rejected proposals or raw input beyond operational context

Out of scope (for MVP):
- Advanced spaced‑repetition algorithms (e.g., full SM‑2 with ratings)
- Importing documents (PDF, DOCX, etc.)
- Sharing sets and external education platform integrations
- Mobile apps
- Automatic language detection
- Autosave/restore of AI proposals; resilience to refresh/network loss for proposals (proposals are ephemeral)
- Extended legal/content policies beyond basics

## 7. Project status
- Version: 0.0.1
- Status: MVP in progress / early development
- Success metrics (high-level goals):
  - ≥75% acceptance rate of AI‑generated proposals per generation session
  - ≥75% of newly created cards should originate from AI (over a given period)
  - Adoption of generation feature (sessions with ≥1 accepted card)

Additional docs:
- Product Requirements: .ai/prd.md
- Tech Stack: .ai/tech-stack.md

## 8. License
No license specified yet. Until a LICENSE file is added, all rights are reserved.
