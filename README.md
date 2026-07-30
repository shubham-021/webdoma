# DoMa Web

> Self-hosted web application to browse, stream, and download files from your [TorBox](https://torbox.app) cloud storage via WebDAV.

## Features

- 🔐 **Secure login** — credentials encrypted in a cookie, never leave your server
- 📁 **File browser** — grid/list views, search, sort, breadcrumb navigation
- ▶️ **Stream to native player** — launch mpv, VLC, IINA directly from the browser
- ⬇️ **Download** — trigger browser downloads with resumable Range support
- 🔗 **Copy link** — share tokenized stream URLs (valid for 1 hour)
- 🌙 **Dark/light mode** — dark by default, toggle anytime
- 🐳 **Docker ready** — standalone build for easy deployment

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) runtime (or Node.js 18+)
- A [TorBox](https://torbox.app) account with WebDAV access

### Setup

```bash
# Clone the repo
git clone <repo-url> doma-web && cd doma-web

# Install dependencies
bun install

# Create environment file
cp .env.example .env.local
# Edit .env.local — set SESSION_SECRET (min 32 chars)
# Generate one with: openssl rand -base64 32

# Start dev server
bun run dev
# → http://localhost:3000
```

### Production

```bash
bun run build
bun run start
```

### Docker

```bash
docker build -t doma-web .
docker run -p 3000:3000 -e SESSION_SECRET="your-secret-here" doma-web
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SESSION_SECRET` | ✅ | — | 32+ char secret for encrypting session cookies |
| `WEBDAV_BASE_URL` | No | `https://webdav.torbox.app` | TorBox WebDAV server URL |
| `PORT` | No | `3000` | Server port |

## Player Support

| Player | macOS | Windows | Linux | Method |
|---|---|---|---|---|
| **mpv** | ✅ | ✅ | ✅ | Server-side launch (self-hosted) |
| **VLC** | ✅ | ✅ | ✅ | Server-side launch |
| **IINA** | ✅ | — | — | Server-side launch |
| **PotPlayer** | — | ✅ | — | Protocol handler |
| **Infuse** | ✅ | — | — | Protocol handler |
| **Custom** | ✅ | ✅ | ✅ | Custom URL template |

## Tech Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · iron-session · webdav · Bun

## License

MIT
