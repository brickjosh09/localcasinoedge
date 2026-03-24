# Treasure Bay API Research

## Platform
- IGT PlayDigital white-label sportsbook
- Frontend: Vue.js SPA
- Backend: "Kansas" content server with cached JSON endpoints

## API Base URL
`https://bettreasurebay.com/cache/`

## Key Endpoints (no auth required!)

### Navigation / Sport Tree
```
GET /cache/psbonav/{region}/{language}/{idfwbonavigation}.json
```
- region = 1
- language = UK
- idfwbonavigation = "top" for root navigation

Example: `https://bettreasurebay.com/cache/psbonav/1/UK/top.json`

Returns sport categories with `idfwmarketgroup` IDs:
- NBA: 51365.1
- NHL: 72291.1
- NCAABK: 51366.1
- Soccer: 82697.1
- MLB Spring Training: 82719.1

### Odds / Market Data
```
GET /cache/psmg/{region}/{language}/{idfwmarketgroup}.json
```

Example: `https://bettreasurebay.com/cache/psmg/1/UK/51365.1.json`

Returns full event + odds data including:
- Event info (teams, sport, start time, live status)
- Markets (Point Spread, Moneyline, Totals)
- Selections with:
  - `currentpriceup` / `currentpricedown` (fractional odds components)
  - `currenthandicap` (spread value)
  - `price` (decimal odds = currentpriceup/currentpricedown + 1... roughly)
  - Teaser info (alternate spreads)

### Event Detail
```
GET /cache/psevent/{region}/{language}/{idfoevent}.json
```

### Site Navigation
```
GET /cache/pssitenav/{language}.json
```

### Search
```
GET /searchmanager/search?searchQuery={query}
GET /searchmanager/sportEvents?idfosport={sportId}
```

## Odds Format
- Odds are in fractional format: `currentpriceup` / `currentpricedown`
- Decimal odds = (currentpriceup / currentpricedown) + 1
- To convert to American:
  - If decimal >= 2.0: American = (decimal - 1) * 100
  - If decimal < 2.0: American = -100 / (decimal - 1)

Example from data:
- currentpriceup=10, currentpricedown=11 → decimal=1.909 → American ≈ -110

## Important Notes
- **No authentication required** for odds data
- **No geofencing** on the cache/content endpoints (geo only gates betting)
- Data updates appear to be cached (not real-time websocket for unauthenticated)
- Need to discover all market group IDs by walking the navigation tree
- `HARDGEOLOCATION` and `SOFTGEOLOCATION` are both false in env-config

## WebSocket (Live Odds)
- The app uses WebSocket for live odds updates (authenticated/in-app only)
- For our purposes, polling the cache endpoints every 1-5 min should be sufficient

## Next Steps
1. Build a scraper that walks the nav tree and pulls all market groups
2. Parse odds into a normalized format
3. Set up periodic polling (every 2-3 minutes)
4. Store in PostgreSQL for history and comparison
