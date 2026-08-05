# WebDoMa

> **Faster CDN Streaming Architecture Available!**
> We are transitioning to a much faster, native TorBox API integration in the **[`feat/cdn_links`](https://github.com/shubham-021/webdoma/tree/feat/cdn_links)** branch. This new architecture replaces `rclone` and WebDAV entirely, retrieving high-speed CDN links directly for lightning-fast streaming and browsing. Check it out!

A web interface to browse, stream, and download files from your TorBox cloud storage.

## How It Works

- **File Listing and Cache**: Uses rclone to list, display, and cache files from your TorBox storage.
- **File Actions**: Uses WebDAV direct connections when performing actions on files such as streaming, downloading, or copying stream links.
- **Local Playback (Aemond)**: Since the web application is typically deployed to a server, it does not launch media players directly. Instead, it communicates with a local daemon (Aemond) running on your machine to open players (mpv, VLC, IINA) locally.

## Getting Started

Choose one of the setup methods below depending on your requirements.

### Option 1: Deployed Site with Local Daemon

If you are using a hosted instance of WebDoMa, you only need to run the daemon on your local machine to launch native media players.

1. Clone and set up the local daemon: [webdoma-aemond](https://github.com/Sn3hil/webdoma-aemond.git).
2. Follow the setup instructions in the daemon repository to build and start the daemon on port 9070.
3. The WebDoMa site will communicate directly with http://localhost:9070 to run your local players.

### Option 2: Unified Local Setup (Orchestrator)

If you want to run both the web interface and the local daemon on your own machine without setting them up separately:

1. Clone the orchestrator repository: [webdoma-orch](https://github.com/shubham-021/webdoma-orch.git).
2. Install dependencies:
   ```bash
   bun install
   ```
3. Configure the required environment variables.
4. Start both the site and the daemon simultaneously:
   ```bash
   bun dev
   ```

### Option 3: Local Site Setup (This Repository)

To run only the web interface locally:

#### Prerequisites

- Bun runtime (v1.0 or higher)
- rclone installed on the system and available in your PATH

#### Installation

1. Clone this repository:
   ```bash
   git clone <repo-url>
   cd webdoma
   ```
2. Install dependencies:
   ```bash
   bun install
   ```

#### Configuration

Create a `.env` file in the root directory based on `.env.example`:

- `SESSION_SECRET`: Key used to encrypt session cookies (minimum 32 characters).
- `AEMOND_CRED_KEY`: Key used to encrypt credentials sent to the local daemon.
- `TMDB_API_KEY`: (Optional) The Movie Database API key to fetch rich metadata (posters, backdrops, and descriptions) for movies and TV shows.

#### Running the Application

Launch the development server:
```bash
bun dev
```

The application will be accessible at http://localhost:3000.

Build and start in production mode:
```bash
bun run build
bun run start
```
