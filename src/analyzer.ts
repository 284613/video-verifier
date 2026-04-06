import { GoogleGenerativeAI } from "@google/generative-ai";
import { UploadedFile, ContentAnalysis } from "./types.js";

const MODEL_NAME = "gemini-1.5-flash";

const ANALYSIS_PROMPT = `Analyze this video and return a JSON object with the following structure. Return ONLY the JSON object with no markdown formatting, no code blocks, no extra text.

{
  "summary": "Brief 2-3 sentence description of the video content",
  "mainTopics": ["topic1", "topic2"],
  "sentiment": "positive|negative|neutral|mixed",
  "language": "primary spoken/written language (e.g. Chinese, English)",
  "hasSubtitles": true|false,
  "estimatedDuration": "e.g. 30 seconds, 2 minutes",
  "contentType": "e.g. tutorial, entertainment, news, advertisement, vlog",
  "keyMoments": [
    { "timestamp": "0:05", "description": "what happens at this moment" }
  ],
  "tags": ["relevant", "descriptive", "tags"],
  "safetyAssessment": {
    "isSafe": true|false,
    "concerns": ["list any concerns, or empty array if none"],
    "rating": "safe|caution|unsafe"
  }
}`;

export async function analyzeVideo(
  apiKey: string,
  uploadedFile: UploadedFile
): Promise<ContentAnalysis> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const result = await model.generateContent([
    {
      fileData: {
        mimeType: uploadedFile.mimeType,
        fileUri: uploadedFile.fileUri,
      },
    },
    { text: ANALYSIS_PROMPT },
  ]);

  const rawText = result.response.text().trim();

  let parsed: ContentAnalysis;
  try {
    parsed = JSON.parse(rawText) as ContentAnalysis;
  } catch (err) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${(err as Error).message}\nRaw response: ${rawText}`
    );
  }

  return parsed;
}
