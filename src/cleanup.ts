import { GoogleAIFileManager } from "@google/generative-ai/server";
import * as fs from "fs";
import * as path from "path";

export async function cleanupLocalFile(localPath: string): Promise<void> {
  try {
    const dir = path.dirname(localPath);
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (err) {
    console.error(
      `Warning: failed to delete local file at ${localPath}: ${(err as Error).message}`
    );
  }
}

export async function cleanupCloudFile(
  apiKey: string,
  fileUri: string
): Promise<void> {
  try {
    const fileManager = new GoogleAIFileManager(apiKey);
    // Extract the file name from the URI (format: https://.../{name})
    const name = extractFileName(fileUri);
    if (name) {
      await fileManager.deleteFile(name);
    }
  } catch (err) {
    console.error(
      `Warning: failed to delete cloud file ${fileUri}: ${(err as Error).message}`
    );
  }
}

function extractFileName(fileUri: string): string | null {
  // URI format: https://generativelanguage.googleapis.com/v1beta/files/{fileId}
  const match = fileUri.match(/\/files\/([^/?#]+)/);
  return match ? `files/${match[1]}` : null;
}
