import express, { Request, Response } from "express";
import cors from "cors";
import * as path from "path";
import { fileURLToPath } from "url";
import { downloadVideo } from "./downloader.js";
import { uploadVideo } from "./uploader.js";
import { analyzeVideo } from "./analyzer.js";
import { cleanupLocalFile, cleanupCloudFile } from "./cleanup.js";
import { AnalysisResult, ContentAnalysis } from "./types.js";
import { emitProgress, ProgressCallback } from "./progressEmitter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public folder
app.use(express.static(path.join(__dirname, "../public")));

// SSE endpoint
app.post("/api/analyze", async (req: Request, res: Response) => {
  const { apiKey, url } = req.body as { apiKey?: string; url?: string };

  // Validate inputs
  if (!apiKey) {
    res.status(400).json({ error: "API key is required" });
    return;
  }
  if (!url) {
    res.status(400).json({ error: "Video URL is required" });
    return;
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const sendEvent = (eventName: string, data: any) => {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const sendProgress = (stage: string, message: string, data?: any) => {
    sendEvent("progress", { stage, message, timestamp: new Date().toISOString(), data });
  };

  // Also emit to the progressEmitter for debugging/logging
  const progressCallback: ProgressCallback = (stage, message, data) => {
    sendProgress(stage, message, data);
  };

  const result: AnalysisResult = {
    success: false,
    url,
    analyzedAt: new Date().toISOString(),
    analysis: null,
  };

  let localPath: string | null = null;
  let fileUri: string | null = null;

  try {
    // Step 1: Download
    sendProgress("download", "Starting video download...");
    const videoMeta = await downloadVideo(url, progressCallback);
    localPath = videoMeta.localPath;
    sendProgress("download", "Video downloaded successfully", {
      title: videoMeta.title,
      localPath,
    });

    // Step 2: Upload
    sendProgress("upload", "Starting cloud upload...");
    const uploadedFile = await uploadVideo(apiKey, localPath, progressCallback);
    fileUri = uploadedFile.fileUri;
    sendProgress("upload", "Video uploaded successfully", { fileUri });

    // Step 3: Analyze
    sendProgress("analyze", "Starting AI analysis...");
    const analysis = await analyzeVideo(apiKey, uploadedFile, progressCallback);
    result.analysis = analysis;
    result.success = true;
    sendProgress("analyze", "Analysis complete!");
  } catch (err) {
    result.error = (err as Error).message;
    sendProgress("error", `Error: ${result.error}`);
  } finally {
    // Step 4: Cleanup (always runs)
    sendProgress("cleanup", "Starting resource cleanup...");
    if (localPath) {
      await cleanupLocalFile(localPath, progressCallback);
    }
    if (fileUri) {
      await cleanupCloudFile(apiKey, fileUri, progressCallback);
    }
    sendProgress("cleanup", "Cleanup complete!");
  }

  // Send final result
  sendEvent("result", result);
  res.end();

  if (!result.success) {
    console.error(`Analysis failed for ${url}: ${result.error}`);
  } else {
    console.log(`Analysis succeeded for ${url}`);
  }
});

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🎬 Video Verifier server running at http://localhost:${PORT}`);
  console.log(`   API endpoint: POST http://localhost:${PORT}/api/analyze`);
  console.log(`   Web UI: http://localhost:${PORT}/index.html`);
});
