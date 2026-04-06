import * as dotenv from "dotenv";
import { downloadVideo } from "./downloader.js";
import { uploadVideo } from "./uploader.js";
import { analyzeVideo } from "./analyzer.js";
import { cleanupLocalFile, cleanupCloudFile } from "./cleanup.js";
import { AnalysisResult } from "./types.js";

dotenv.config();

async function main(): Promise<void> {
  const url = process.argv[2];
  if (!url) {
    console.error("Usage: npx tsx src/index.ts <video-url>");
    process.exit(1);
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("Error: GOOGLE_API_KEY environment variable is not set.");
    process.exit(1);
  }

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
    process.stderr.write(`[1/4] Downloading video from: ${url}\n`);
    const videoMeta = await downloadVideo(url);
    localPath = videoMeta.localPath;
    process.stderr.write(`[1/4] Downloaded to: ${localPath}\n`);

    // Step 2: Upload
    process.stderr.write(`[2/4] Uploading to Google AI File Manager...\n`);
    const uploadedFile = await uploadVideo(apiKey, localPath);
    fileUri = uploadedFile.fileUri;
    process.stderr.write(`[2/4] Uploaded: ${fileUri}\n`);

    // Step 3: Analyze
    process.stderr.write(`[3/4] Analyzing with Gemini 1.5 Flash...\n`);
    const analysis = await analyzeVideo(apiKey, uploadedFile);
    result.analysis = analysis;
    result.success = true;
    process.stderr.write(`[3/4] Analysis complete.\n`);
  } catch (err) {
    result.error = (err as Error).message;
    process.stderr.write(`Error: ${result.error}\n`);
  } finally {
    // Step 4: Cleanup
    process.stderr.write(`[4/4] Cleaning up resources...\n`);
    if (localPath) {
      await cleanupLocalFile(localPath);
    }
    if (fileUri) {
      await cleanupCloudFile(apiKey, fileUri);
    }
    process.stderr.write(`[4/4] Cleanup complete.\n`);
  }

  // Output pure JSON to stdout
  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
