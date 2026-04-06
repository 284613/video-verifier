# Video Verifier — Douyin Video Analyzer with Gemini AI

A single-pipeline CLI tool that downloads a Douyin (or any yt-dlp-supported) video, uploads it to Google AI, analyzes it with Gemini 1.5 Flash, outputs structured JSON, and cleans up all resources automatically.

## Pipeline

```
URL → yt-dlp download → Google AI upload → Gemini 1.5 Flash analysis → JSON output → cleanup
```

## Setup

### 1. Prerequisites

- Node.js 18+
- `yt-dlp` installed and on your PATH ([install guide](https://github.com/yt-dlp/yt-dlp#installation))
- A Google Gemini API key ([get one here](https://aistudio.google.com/app/apikey))

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env and set your GOOGLE_API_KEY
```

### 4. Run

```bash
npm start <video-url>
# e.g.
npm start "https://www.douyin.com/video/1234567890"
```

Progress messages are written to **stderr**. The final JSON result is written to **stdout**, so you can pipe it:

```bash
npm start "https://www.douyin.com/video/..." > result.json
```

## Output Format

```json
{
  "success": true,
  "url": "https://...",
  "analyzedAt": "2026-04-07T00:00:00.000Z",
  "analysis": {
    "summary": "...",
    "mainTopics": ["topic1", "topic2"],
    "sentiment": "positive",
    "language": "Chinese",
    "hasSubtitles": false,
    "estimatedDuration": "30 seconds",
    "contentType": "entertainment",
    "keyMoments": [
      { "timestamp": "0:05", "description": "..." }
    ],
    "tags": ["tag1", "tag2"],
    "safetyAssessment": {
      "isSafe": true,
      "concerns": [],
      "rating": "safe"
    }
  }
}
```

On failure, `success` is `false` and an `error` field is included.

## Build (optional)

```bash
npm run build
node dist/index.js <video-url>
```
