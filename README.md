# 🎬 Video Verifier — 抖音视频 AI 分析器

基于 Gemini 1.5 Flash 的抖音视频解析工具，支持 SSE 实时进度推送。

## 功能特点

- 📥 **视频下载** — yt-dlp 异步下载抖音视频
- ☁️ **云端上传** — Google AI File Manager 托管视频
- 🤖 **AI 分析** — Gemini 1.5 Flash 多模态理解
- 🧹 **自动清理** — 本地文件 + 云端缓存双重清理
- 📊 **实时进度** — Server-Sent Events 流式推送

## Web 界面

启动服务后访问 http://localhost:3000

![Video Verifier Interface](https://img.shields.io/badge/Interface-Web-blue)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动服务

```bash
npm start
```

服务启动后，打开浏览器访问：**http://localhost:3000**

### 3. 使用

1. 输入你的 Google AI API Key
2. 粘贴抖音视频链接
3. 点击"开始解析"
4. 实时查看进度和最终分析结果

## API 接口

### POST /api/analyze

分析视频并返回结果（支持 SSE 进度推送）

**请求体：**
```json
{
  "apiKey": "your_google_api_key",
  "url": "https://v.douyin.com/xxxxx"
}
```

**SSE 事件流：**

- `progress` — 实时进度事件
  ```json
  { "stage": "download", "message": "Starting video download...", "timestamp": "..." }
  ```
- `result` — 最终结果
  ```json
  { "success": true, "url": "...", "analysis": {...} }
  ```

### GET /api/health

健康检查接口

## 输出格式

```json
{
  "success": true,
  "url": "https://v.douyin.com/xxxxx",
  "analyzedAt": "2026-04-07T...",
  "analysis": {
    "summary": "视频内容简述",
    "mainTopics": ["话题1", "话题2"],
    "sentiment": "positive",
    "language": "中文",
    "hasSubtitles": false,
    "estimatedDuration": "30秒",
    "contentType": "娱乐",
    "keyMoments": [
      { "timestamp": "0:05", "description": "..." }
    ],
    "tags": ["标签1", "标签2"],
    "safetyAssessment": {
      "isSafe": true,
      "concerns": [],
      "rating": "safe"
    }
  }
}
```

## 前置要求

- **Node.js 18+**
- **ffmpeg**（yt-dlp 依赖）
  ```bash
  # Windows: 下载并添加 PATH
  # https://www.gyan.dev/ffmpeg/builds/
  ```
- **Google AI API Key**（免费申请：https://aistudio.google.com/app/apikey）

## 技术栈

- Express.js — 后端服务
- Server-Sent Events — 实时进度推送
- TypeScript — 类型安全
- yt-dlp-exec — 视频下载
- @google/generative-ai — Gemini AI

## 项目结构

```
├── src/
│   ├── index.ts           # Express 服务器入口
│   ├── downloader.ts      # 视频下载
│   ├── uploader.ts        # 云端上传
│   ├── analyzer.ts        # AI 分析
│   ├── cleanup.ts         # 资源清理
│   ├── progressEmitter.ts  # 进度事件发射器
│   └── types.ts           # 类型定义
├── public/
│   └── index.html         # Web 界面
├── package.json
└── README.md
```

## License

MIT
