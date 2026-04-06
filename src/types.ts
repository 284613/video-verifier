export interface VideoMetadata {
  url: string;
  title?: string;
  duration?: number;
  localPath: string;
}

export interface UploadedFile {
  fileUri: string;
  mimeType: string;
  displayName: string;
}

export interface ContentAnalysis {
  summary: string;
  mainTopics: string[];
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  language: string;
  hasSubtitles: boolean;
  estimatedDuration: string;
  contentType: string;
  keyMoments: KeyMoment[];
  tags: string[];
  safetyAssessment: SafetyAssessment;
}

export interface KeyMoment {
  timestamp: string;
  description: string;
}

export interface SafetyAssessment {
  isSafe: boolean;
  concerns: string[];
  rating: "safe" | "caution" | "unsafe";
}

export interface AnalysisResult {
  success: boolean;
  url: string;
  analyzedAt: string;
  analysis: ContentAnalysis | null;
  error?: string;
}
