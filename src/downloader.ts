import ytDlp from "yt-dlp-exec";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { VideoMetadata } from "./types.js";

export async function downloadVideo(url: string): Promise<VideoMetadata> {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-verifier-"));
  const outputTemplate = path.join(tmpDir, "%(id)s.%(ext)s");

  let title: string | undefined;
  let duration: number | undefined;

  try {
    const info = await ytDlp(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      preferFreeFormats: true,
    } as Parameters<typeof ytDlp>[1]);

    if (info && typeof info === "object") {
      const infoObj = info as Record<string, unknown>;
      title = typeof infoObj.title === "string" ? infoObj.title : undefined;
      duration =
        typeof infoObj.duration === "number" ? infoObj.duration : undefined;
    }
  } catch {
    // Non-fatal: metadata fetch failed, continue with download
  }

  await ytDlp(url, {
    output: outputTemplate,
    format: "mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    noWarnings: true,
    noCallHome: true,
  } as Parameters<typeof ytDlp>[1]);

  const files = fs.readdirSync(tmpDir);
  if (files.length === 0) {
    throw new Error(`No file downloaded to ${tmpDir}`);
  }

  const localPath = path.join(tmpDir, files[0]);

  return { url, title, duration, localPath };
}
