export interface ScanResult {
  text: string;
  offset: number;
  hexOffset: string;
  id: string;
  bytes?: string; // Hex representation of bytes at this offset
  tags?: string[];
  status?: 'new' | 'removed' | 'changed' | 'unchanged';
  isFavorite?: boolean;
  hints?: string[];
  isNew?: boolean;
  frequency?: number;
  length?: number;
}

export interface Workspace {
  id: string;
  name: string;
  results: ScanResult[];
  timestamp: number;
  fileName?: string;
}

export interface ComparisonHistory {
  id: string;
  timestamp: number;
  oldFileName: string;
  newFileName: string;
  stats: {
    new: number;
    removed: number;
    changed: number;
  };
  results: ScanResult[];
}

export interface ScanHistory {
  id: string;
  timestamp: number;
  fileName: string;
  resultCount: number;
  results: ScanResult[];
}

export interface RecentFile {
  name: string;
  size: number;
  timestamp: number;
  lastChunk?: number;
}

export interface SavedEntry {
  id: string;
  name: string;
  offset: string;
  text: string;
  tags: string[];
  timestamp: number;
}

export interface ScanProgress {
  scannedBytes: number;
  totalBytes: number;
  stringsFound: number;
  currentChunk: number;
  totalChunks: number;
  isScanning: boolean;
  isPaused: boolean;
  startTime: number;
  endTime?: number;
  phase?: 'strings' | 'patterns';
}

export type ScanMode = 'safe' | 'balanced' | 'fast';

export interface ScanOptions {
  minLength: number;
  maxLength: number;
  mode: ScanMode;
  removeDuplicates: boolean;
  resultLimit: number;
  searchPattern?: string; // AOB pattern to search for
}

export interface WorkerMessage {
  type: 'chunk' | 'complete' | 'error' | 'context';
  data?: any;
}

export interface ChunkData {
  buffer: ArrayBuffer;
  offset: number;
  minLength: number;
  searchPattern?: string;
  extractBytes?: boolean;
}
