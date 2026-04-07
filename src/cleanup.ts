import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from "fs";
import * as path from "path";
import { ProgressCallback } from "./progressEmitter.js";

export async function cleanupLocalFile(
  localPath: string,
  onProgress?: ProgressCallback
): Promise<void> {
  const progress = (msg: string) => {
    if (onProgress) onProgress("cleanup", msg);
  };

  try {
    const dir = path.dirname(localPath);
    fs.rmSync(dir, { recursive: true, force: true });
    progress(`Local file deleted: ${path.basename(localPath)}`);
  } catch (err) {
    progress(`Warning: failed to delete local file at ${localPath}: ${(err as Error).message}`);
  }
}

export async function cleanupCloudFile(
  apiKey: string,
  fileUri: string,
  onProgress?: ProgressCallback
): Promise<void> {
  const progress = (msg: string) => {
    if (onProgress) onProgress("cleanup", msg);
  };

  try {
    const fileManager = new GoogleAIFileManager(apiKey);
    const name = extractFileName(fileUri);
    if (name) {
      await fileManager.deleteFile(name);
      progress(`Cloud file deleted: ${fileUri}`);
    }
  } catch (err) {
    progress(`Warning: failed to delete cloud file ${fileUri}: ${(err as Error).message}`);
  }
}

function extractFileName(fileUri: string): string | null {
  const match = fileUri.match(/\/files\/([^/?#]+)/);
  return match ? `files/${match[1]}` : null;
}
