export interface AnalysisData {
  covered_events: string[];
  exclusions: string[];
  risky_clauses: string[];
  coverage_score: number;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisData;
  error?: string;
}

export interface SavedPolicy {
  id: string;
  fileName: string;
  fileSize: string;
  policyType: string;
  analyzedAt: string;
  data: AnalysisData;
}
