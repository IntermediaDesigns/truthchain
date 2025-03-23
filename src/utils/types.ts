/**
 * Common types used throughout the application
 */

// Application state
export interface AppState {
    isLoading: boolean;
    isAIInitialized: boolean;
    isBlockchainConnected: boolean;
    error: string | null;
  }
  
  // Metadata about the verification
  export interface VerificationMetadata {
    timestamp: number;
    duration: number;
    blockchainStatus: 'none' | 'pending' | 'success' | 'failed';
    transactionHash?: string;
  }
  
  // Interface for a verification transaction
  export interface VerificationTransaction {
    hash: string;
    timestamp: number;
    status: 'pending' | 'confirmed' | 'failed';
    contentHash: string;
    blockNumber?: number;
  }
  
  // Statistics about verifications
  export interface VerificationStats {
    totalVerifications: number;
    verifiedContent: number;
    rejectedContent: number;
    avgConfidenceScore: number;
  }