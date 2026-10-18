# PADYAKWATTS

A static front-end demo for a pedal-powered charging station: a marketing site plus a
client-side user dashboard. No backend, no database — all data lives in `localStorage`.

## Overview

PADYAKWATTS lets visitors explore the product concept, create an account, and track
simulated energy generation, points, and environmental impact from a dashboard.

## Features

- **Landing page** — hero, features, mission, use cases, live impact tracker, contact form,
  mobile navigation, and animated energy effects.
- **Account flow** — signup with validation and password strength feedback, login, logout,
  and a simulated forgot-password form.
- **Dashboard** — tabbed interface (Energy Stats, Report a Problem, Profile Settings) with
  hash-based routing and no page reloads.
- **Energy tracking** — Chart.js weekly generation chart, lifetime/today totals, CO₂ saved,
  session history, and a "Simulate a Session" action.
- **Reports** — submit issues with optional screenshot previews and view submitted reports.
- **Profile** — edit personal details, change password, manage preferences, export all data
  as JSON, and delete the account.
- **Demo access** — a seeded demo account with 30 days of sample sessions.

## Demo Credentials

| Field    | Value                    |
| -------- | ------------------------ |
| Email    | `demo@padyakwatts.ph`    |
| Password | `Demo@123`               |

You can also open `dashboard.html?demo=1` directly to enter the populated dashboard
without signing in.

## Getting Started

No installation or build step is required — `css/tailwind.css` is precompiled.

1. Open `index.html` in a browser, or serve the folder locally:
   ```bash
   npx serve .
