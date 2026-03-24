# GulfCoast Odds -- Product Spec

## What It Is

A subscription web app that helps Mississippi sports bettors find +EV (positive expected value) and arbitrage opportunities by comparing local casino sportsbook odds against sharp market lines.

## The Problem

Mississippi bettors at casino sportsbooks have no easy way to know if the odds they're getting are good. National tools (OddsJam, DarkHorse, Unabated) don't track Mississippi casino-specific odds. Bettors are flying blind.

## The Solution

A clean, mobile-first dashboard that:
1. Pulls live odds from Mississippi casino sportsbooks (starting with Treasure Bay)
2. Compares them against sharp/consensus lines (Pinnacle, market consensus)
3. Highlights +EV bets and arbitrage opportunities
4. Gives users clear, actionable plays before they walk into a casino

## Target Customer

- Sports bettors who frequent Mississippi casinos (Biloxi, Tunica, Gulfport)
- Ranges from casual bettors who want an edge to semi-sharp bettors doing this seriously
- Comfortable with a phone/web app
- Willing to pay $30-50/month for a real edge

## Core Features (MVP)

### 1. Odds Dashboard
- Current odds from supported MS casinos, organized by sport
- Side-by-side comparison with sharp lines
- Color-coded: green (+EV), gold (arbitrage), red (bad line)
- Filterable by sport, casino, bet type

### 2. +EV Bet Finder
- Automatically scans all available lines
- Calculates expected value using no-vig sharp line as true probability
- Shows: event, bet type, casino odds, sharp odds, EV%, suggested Kelly stake
- Sortable by EV%, sport, time to event

### 3. Arbitrage Detector
- Finds guaranteed-profit opportunities across casinos or casino vs. sharp
- Shows: event, both sides of the arb, stake split, guaranteed profit %
- Alerts when new arbs appear (push notification / SMS)

### 4. Alerts & Notifications
- Push/SMS when a +EV opportunity above user threshold appears
- "Line move" alerts for games the user is watching
- Configurable: minimum EV%, sports, casinos

### 5. Bankroll Tracker (v2)
- Log bets placed, track P&L over time
- See actual results vs. expected value
- Prove the system works

## Supported Casinos (Phase 1)

| Casino | Location | Sportsbook Platform | Online Odds? |
|--------|----------|--------------------|--------------| 
| Treasure Bay | Biloxi | Independent (bettreasurebay.com) | Yes |
| Boomtown | Biloxi | Independent (boomtownbiloxi.com) | Likely |

### Phase 2 Expansion
- Beau Rivage (BetMGM) -- Biloxi
- Golden Nugget (DraftKings) -- Biloxi
- Hard Rock (Bally Bet) -- Biloxi
- Harrah's Gulf Coast (Caesars) -- Biloxi
- Tunica casinos

Note: Phase 2 casinos use major platforms whose lines will closely mirror national odds. The biggest edge will come from independent books like Treasure Bay.

## Sharp Line Sources

- **The Odds API** ($30-119/mo depending on usage) -- covers Pinnacle, DraftKings, FanDuel, etc.
- **Pinnacle** as primary sharp benchmark (the "true odds" reference)
- Consensus no-vig line calculated from multiple sharps

## Revenue Model

- Monthly subscription: $29.99/mo or $249.99/year
- Free tier: see odds dashboard with 15-min delay, no alerts, no arb finder
- Premium: real-time odds, +EV finder, arb alerts, full access

## Tech Stack (Proposed)

### Frontend
- Next.js (React) -- mobile-first responsive web app
- Hosted on Vercel or similar
- PWA (Progressive Web App) so users can "install" it on their phone

### Backend
- Node.js / Python for odds scraping and comparison engine
- PostgreSQL for odds history, user data, bet tracking
- Redis for real-time odds caching and pub/sub alerts

### Data Pipeline
- Scraper service: hits casino sportsbook sites every 1-5 minutes
- Sharp odds fetcher: pulls from The Odds API on same interval
- Comparison engine: calculates EV, detects arbs, generates alerts
- All runs on a simple VPS (can start on the same Hostinger box)

### Notifications
- Telegram bot (for beta users -- free)
- SMS via Twilio ($$ per message)
- Web push notifications (free)
- Email alerts via SendGrid

## User Flow

1. User signs up, picks their casino(s) and sports
2. Dashboard shows all current +EV and arb opportunities
3. User sees: "Treasure Bay has LSU +7.5 at -105. Sharp line is +7 at -110. EV: +3.2%. Bet $50 to maximize edge."
4. User drives to Treasure Bay, places the bet
5. Logs the bet in the app, tracks results over time

## Competitive Landscape

| Tool | Covers MS Casinos? | Price |
|------|-------------------|-------|
| OddsJam | No | $39-99/mo |
| DarkHorse Odds | No | $49-99/mo |
| Unabated | No | $99-199/mo |
| **GulfCoast Odds (us)** | **Yes** | **$29.99/mo** |

## Key Risks

1. **Data access** -- Casino sites may block scraping, change formats, or require auth
2. **Market size** -- MS sports betting handle was ~$400M in 2023. How many active bettors would pay for this?
3. **Edge durability** -- If casinos notice bettors consistently beating them, they may tighten lines or limit bettors
4. **Legal gray area** -- Scraping casino odds data. Need legal review.
5. **Line staleness** -- If scraping interval is too slow, odds may have moved by the time user places bet

## MVP Timeline (Estimated)

- **Week 1-2:** Build Treasure Bay scraper, validate data quality
- **Week 3-4:** Integrate The Odds API, build comparison engine
- **Week 5-6:** Build frontend dashboard (mobile-first)
- **Week 7-8:** Add alerts (Telegram + email), subscription/payment
- **Week 9-10:** Beta test with ~10 local bettors, iterate
- **Week 11-12:** Launch

## Open Questions

1. ~~What should we call this thing?~~ **GulfCoast Odds**
2. How many MS bettors can we realistically reach? (marketing channels)
3. Should we start with a Telegram bot MVP before building the full web app?
4. Affiliate model -- could we partner with casinos instead of (or in addition to) subscriptions?
5. Building in-house (Josh + Brian) -- no outside hires unless absolutely necessary
