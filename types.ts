export interface ISMElement {
  id: string;
  name: string;
  description?: string;
  category?: string;
}

export enum SSIMValue {
  V = 'V', // i reaches j
  A = 'A', // j reaches i
  X = 'X', // Both reach each other
  O = 'O', // No relation
}

export type SSIMData = Record<string, Record<string, SSIMValue>>;

export type BinaryMatrix = number[][];

export interface LevelPartition {
  level: number;
  elements: number[]; // Indices of elements
}

export interface ISMResult {
  initialReachabilityMatrix: BinaryMatrix;
  finalReachabilityMatrix: BinaryMatrix; // After transitivity
  canonicalMatrix: BinaryMatrix; // Skeleton matrix for graph (transitive reduction)
  levels: LevelPartition[];
}

export enum AppStep {
  SETUP_TOPIC = 0,
  DEFINE_FACTORS = 1,
  FILL_SSIM = 2,
  ANALYSIS_RESULT = 3,
}