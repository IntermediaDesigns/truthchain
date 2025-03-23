export interface AppState {
  isLoading: boolean;
  isAIInitialized: boolean;
  isBlockchainConnected: boolean;
  error: string | null;
}

export interface VerificationMetadata {
  timestamp: number;
  duration: number;
  blockchainStatus: "none" | "pending" | "success" | "failed";
  transactionHash?: string;
}

export interface VerificationTransaction {
  hash: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  contentHash: string;
  blockNumber?: number;
}

export interface VerificationStats {
  totalVerifications: number;
  verifiedContent: number;
  rejectedContent: number;
  avgConfidenceScore: number;
}
