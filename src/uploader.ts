import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import * as path from "path";
import { UploadedFile } from "./types.js";

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 60; // 3 minutes max

export async function uploadVideo(
  apiKey: string,
  localPath: string
): Promise<UploadedFile> {
  const fileManager = new GoogleAIFileManager(apiKey);
  const displayName = path.basename(localPath);

  const uploadResponse = await fileManager.uploadFile(localPath, {
    mimeType: "video/mp4",
    displayName,
  });

  const fileUri = uploadResponse.file.uri;
  const name = uploadResponse.file.name;

  // Poll until the file is ACTIVE
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const fileMeta = await fileManager.getFile(name);

    if (fileMeta.state === FileState.ACTIVE) {
      return { fileUri, mimeType: "video/mp4", displayName };
    }

    if (fileMeta.state === FileState.FAILED) {
      throw new Error(`File processing failed for: ${fileUri}`);
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`File did not become ACTIVE within the timeout: ${fileUri}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
