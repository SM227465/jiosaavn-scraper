# JioSaavn Scraper Guide

This project includes a JioSaavn web scraper that runs as a cron job every 6 hours to collect music data and store it in Redis.

## Features

- **Automated Scraping**: Scrapes JioSaavn website every 6 hours using a cron job
- **Data Categories**:
  - New Releases
  - Top Charts
  - Top Playlists (with IDs for use with saavn.sumit.co API)
  - Top Artists
- **Redis Storage**: All scraped data is stored in Redis for fast access
- **REST API**: Access scraped data through simple REST endpoints

## Setup

### 1. Install Redis

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**On macOS:**
```bash
brew install redis
brew services start redis
```

**Using Docker:**
```bash
docker run -d -p 6379:6379 redis:latest
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=8000
NODE_ENV=development
REDIS_URL=redis://localhost:6379
```

For remote Redis (Redis Cloud, etc.):
```env
REDIS_URL=redis://username:password@your-redis-host.com:6379
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

**Development mode:**
```bash
pnpm start:dev
```

**Production mode:**
```bash
pnpm build
pnpm start:prod
```

## API Endpoints

All endpoints are prefixed with `/api/jiosaavn`

### Get All Data
```
GET /api/jiosaavn
```
Returns all scraped data (new releases, top charts, playlists, and artists).

**Response:**
```json
{
  "success": true,
  "data": {
    "newReleases": [...],
    "topCharts": [...],
    "topPlaylists": [...],
    "topArtists": [...],
    "scrapedAt": "2026-01-03T10:30:00.000Z"
  }
}
```

### Get New Releases
```
GET /api/jiosaavn/new-releases
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "album-id-123",
      "title": "Album Name",
      "url": "https://www.jiosaavn.com/album/...",
      "image": "https://...",
      "artists": "Artist Name"
    }
  ]
}
```

### Get Top Charts
```
GET /api/jiosaavn/top-charts
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "chart-id-456",
      "title": "Top 50 Hindi",
      "url": "https://www.jiosaavn.com/...",
      "image": "https://...",
      "subtitle": "Hindi"
    }
  ]
}
```

### Get Top Playlists
```
GET /api/jiosaavn/top-playlists
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "playlist-id-789",
      "title": "Bollywood Top 50",
      "url": "https://www.jiosaavn.com/featured/...",
      "image": "https://..."
    }
  ]
}
```

**Using playlist IDs with saavn.sumit.co API:**
Once you have the playlist IDs from this endpoint, you can use them with the external API:
```bash
curl https://saavn.sumit.co/api/playlists?id=playlist-id-789
```

### Get Top Artists
```
GET /api/jiosaavn/top-artists
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "artist-id-321",
      "name": "Artist Name",
      "url": "https://www.jiosaavn.com/artist/...",
      "image": "https://..."
    }
  ]
}
```

### Get Last Scraped Timestamp
```
GET /api/jiosaavn/last-scraped
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lastScraped": "2026-01-03T10:30:00.000Z"
  }
}
```

## Cron Job Schedule

The scraper runs automatically every 6 hours at:
- 00:00 (midnight)
- 06:00 (6 AM)
- 12:00 (noon)
- 18:00 (6 PM)

The scraper also runs immediately when the server starts.

## Architecture

### File Structure
```
src/
├── controllers/
│   └── jiosaavn.controller.ts    # API request handlers
├── services/
│   └── jiosaavn.scraper.ts       # Web scraping logic
├── routes/
│   └── jiosaavn.routes.ts        # API route definitions
├── jobs/
│   └── jiosaavn.cron.ts          # Cron job scheduler
├── utils/
│   ├── redis.util.ts             # Redis client
│   └── logger.util.ts            # Logger utility
├── index.ts                       # Express app setup
└── server.ts                      # Server initialization
```

### Data Flow

1. **Cron Job** triggers every 6 hours
2. **Scraper Service** fetches and parses JioSaavn website
3. **Data Extraction** extracts IDs, titles, URLs, and images
4. **Redis Storage** stores data with separate keys:
   - `jiosaavn:newReleases`
   - `jiosaavn:topCharts`
   - `jiosaavn:topPlaylists`
   - `jiosaavn:topArtists`
   - `jiosaavn:all` (complete dataset)
   - `jiosaavn:lastScraped` (timestamp)
5. **API Endpoints** retrieve data from Redis and return to clients

## Important Notes

### Web Scraping Considerations

The scraper uses CSS selectors to extract data from JioSaavn's website. If JioSaavn updates their HTML structure, the selectors in [jiosaavn.scraper.ts](src/services/jiosaavn.scraper.ts) may need to be updated.

**Current selectors target:**
- `.o-new-release`, `.new-album-block`, `[data-type="album"]` for new releases
- `.o-chart`, `.chart-block`, `[data-type="chart"]` for top charts
- `.o-playlist`, `.playlist-block`, `[data-type="playlist"]` for playlists
- `.o-artist`, `.artist-block`, `[data-type="artist"]` for artists

If you notice empty arrays in the API responses, inspect the JioSaavn website HTML and update the selectors accordingly.

### Redis Data Persistence

By default, Redis stores data in memory. For production:

1. Enable Redis persistence in `redis.conf`:
   ```
   save 900 1
   save 300 10
   save 60 10000
   ```

2. Or use Redis Cloud/managed Redis service for automatic persistence and backups.

### Integration with saavn.sumit.co API

This scraper extracts playlist/song/album IDs from JioSaavn, which you can then use with the saavn.sumit.co API:

```bash
# Get playlist details
curl https://saavn.sumit.co/api/playlists?id=PLAYLIST_ID

# Get song details
curl https://saavn.sumit.co/api/songs?id=SONG_ID

# Get album details
curl https://saavn.sumit.co/api/albums?id=ALBUM_ID
```

See the full API documentation at: https://saavn.sumit.co/docs

## Troubleshooting

### Redis Connection Issues
```
Error: Redis Client Error
```
- Ensure Redis is running: `redis-cli ping` (should return "PONG")
- Check `REDIS_URL` in your `.env` file
- Verify firewall/network settings if using remote Redis

### Empty Scraping Results
```json
{
  "newReleases": [],
  "topCharts": [],
  ...
}
```
- JioSaavn may have updated their HTML structure
- Inspect the website and update CSS selectors in `jiosaavn.scraper.ts`
- Check if the website is accessible: `curl https://www.jiosaavn.com`

### Cron Job Not Running
- Check server logs for errors
- Verify the cron job is initialized in `server.ts`
- The job runs every 6 hours - wait for the next scheduled time or restart the server

## License

MIT
