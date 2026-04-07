import { EventEmitter } from "events";

export interface ProgressEvent {
  stage: string;
  message: string;
  timestamp: string;
  data?: any;
}

export const progressEmitter = new EventEmitter();

export function emitProgress(
  stage: string,
  message: string,
  data?: any
): void {
  progressEmitter.emit("progress", {
    stage,
    message,
    timestamp: new Date().toISOString(),
    data,
  } as ProgressEvent);
}

export type ProgressCallback = (stage: string, message: string, data?: any) => void;
