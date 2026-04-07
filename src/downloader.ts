import ytDlp from "yt-dlp-exec";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { VideoMetadata } from "./types.js";
import { ProgressCallback } from "./progressEmitter.js";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36";

// Try different browsers for cookies
const BROWSERS = ["edge", "chrome", "brave"] as const;

const getBaseOptions = (browser?: string) => {
  const options: any = {
    addHeaders: {
      "User-Agent": USER_AGENT,
      "Referer": "https://www.douyin.com/",
      "Origin": "https://www.douyin.com",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
      "Upgrade-Insecure-Requests": "1"
    },
    noCheckCertificates: true,
    preferFreeFormats: true,
    youtubeSkipDashManifest: true,
  };

  const cookiesPath = path.join(process.cwd(), "cookies.txt");
  if (fs.existsSync(cookiesPath)) {
    options.cookies = cookiesPath.replace(/\\/g, "/");
  } else if (browser) {
    options.cookiesFromBrowser = browser;
  }

  return options;
};

export async function downloadVideo(
  url: string,
  onProgress?: ProgressCallback
): Promise<VideoMetadata> {
  const progress = (msg: string, data?: any) => {
    if (onProgress) onProgress("download", msg, data);
  };

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "video-verifier-"));
  const outputTemplate = `${tmpDir.replace(/\\/g, "/")}/%(id)s.%(ext)s`;

  // Check if we are using cookie file
  const cookiesPath = path.join(process.cwd(), "cookies.txt");
  const usingCookieFile = fs.existsSync(cookiesPath);
  if (usingCookieFile) {
    progress("Using cookies.txt file for authentication...");
  }

  progress("Fetching video metadata...");

  let title: string | undefined;
  let duration: number | undefined;

  // Attempt to get info
  let info: any = null;

  if (usingCookieFile) {
    try {
      info = await ytDlp(url, {
        dumpSingleJson: true,
        noWarnings: true,
        preferFreeFormats: true,
        ...getBaseOptions(),
      } as Parameters<typeof ytDlp>[1]);
    } catch (err) {
      progress("Metadata fetch with cookies.txt failed, checking browser cookies...");
    }
  }

  if (!info) {
    for (const browser of BROWSERS) {
      try {
        progress(`Attempting to fetch metadata using ${browser} cookies...`);
        info = await ytDlp(url, {
          dumpSingleJson: true,
          noWarnings: true,
          preferFreeFormats: true,
          ...getBaseOptions(browser),
        } as Parameters<typeof ytDlp>[1]);
        if (info) break;
      } catch (err) {
        console.error(`Failed to use ${browser} cookies:`, (err as Error).message);
      }
    }
  }

  if (info && typeof info === "object") {
    const infoObj = info as Record<string, unknown>;
    title = typeof infoObj.title === "string" ? infoObj.title : undefined;
    duration = typeof infoObj.duration === "number" ? infoObj.duration : undefined;
    progress(`Metadata fetched: ${title || "Untitled"}`);
  }

  progress("Starting video download...");

  // Try download
  let downloadSuccess = false;

  if (usingCookieFile) {
    try {
      progress("Downloading using cookies.txt...");
      await ytDlp(url, {
        output: outputTemplate,
        format: "mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        noWarnings: true,
        ...getBaseOptions(),
      } as Parameters<typeof ytDlp>[1]);
      downloadSuccess = true;
    } catch (err) {
      progress("Download with cookies.txt failed, trying browser cookies...");
    }
  }

  if (!downloadSuccess) {
    for (const browser of BROWSERS) {
      try {
        progress(`Attempting download using ${browser} cookies...`);
        await ytDlp(url, {
          output: outputTemplate,
          format: "mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
          noWarnings: true,
          ...getBaseOptions(browser),
        } as Parameters<typeof ytDlp>[1]);
        downloadSuccess = true;
        break;
      } catch (err) {
        console.error(`Download failed with ${browser}:`, (err as Error).message);
      }
    }
  }

  if (!downloadSuccess) {
    progress("Trying download without cookies as last resort...");
    try {
      await ytDlp(url, {
        output: outputTemplate,
        format: "mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        noWarnings: true,
        ...getBaseOptions(),
      } as Parameters<typeof ytDlp>[1]);
    } catch (err) {
      throw new Error(`所有尝试均失败。请检查 cookies.txt 是否有效或尝试关闭浏览器。错误详情: ${(err as Error).message}`);
    }
  }

  const files = fs.readdirSync(tmpDir);
  if (files.length === 0) {
    throw new Error(`No file downloaded to ${tmpDir}`);
  }

  const localPath = path.join(tmpDir, files[0]);
  progress(`Download complete: ${path.basename(localPath)}`, {
    localPath,
    title,
    duration,
  });

  return { url, title, duration, localPath };
}
