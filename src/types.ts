export interface VideoSource {
  type: 'url' | 'file';
  source: string | File;
}

export interface DetectedScene {
  startTime: number;
  endTime: number;
  thumbnail?: string;
  clipUrl?: string;
  score: number;
}

export interface AnalysisProgress {
  stage: 'preparing' | 'analyzing' | 'extracting' | 'complete';
  percent: number;
  currentTask?: string;
}

export interface AnalysisResult {
  scenes: DetectedScene[];
  duration: number;
}

export interface SkinToneRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface AudioPeak {
  time: number;
  intensity: number;
}

export interface FrameAnalysis {
  time: number;
  skinConfidence: number;
  audioIntensity: number;
  skinRegions?: SkinToneRegion[];
}