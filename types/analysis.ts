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

export interface SimulateRequest {
  scenario: string;
  analysis: AnalysisData & {
    policy_type?: string;
    score_reason?: string;
  };
}

export interface SimulateResult {
  approval_chance: number;
  verdict: 'Likely Approved' | 'Likely Rejected' | 'Partial Coverage' | 'Unclear';
  covered_aspects: string[];
  not_covered_aspects: string[];
  risks: string[];
  documents_needed: string[];
  reasoning: string;
}
