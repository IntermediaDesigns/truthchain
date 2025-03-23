import { ContentType } from "./aiService";

interface StoredVerification {
  id: string;
  content: string;
  contentType: ContentType;
  timestamp: number;
  isVerified: boolean;
  confidenceScore: number;
  aiModelUsed: string;
  explanation: string;
}

const VERIFICATION_HISTORY_KEY = "truthchain_verification_history";
const MAX_HISTORY_ITEMS = 10;

export class StorageService {
  public saveVerification(
    content: string,
    contentType: ContentType,
    isVerified: boolean,
    confidenceScore: number,
    aiModelUsed: string,
    explanation: string
  ): void {
    try {
      const id = this.generateId(content);

      const verification: StoredVerification = {
        id,
        content: this.truncateContent(content, contentType),
        contentType,
        timestamp: Date.now(),
        isVerified,
        confidenceScore,
        aiModelUsed,
        explanation,
      };

      const existingHistory = this.getVerificationHistory();

      const existingIndex = existingHistory.findIndex((item) => item.id === id);

      if (existingIndex !== -1) {
        existingHistory[existingIndex] = verification;
      } else {
        existingHistory.unshift(verification);
        if (existingHistory.length > MAX_HISTORY_ITEMS) {
          existingHistory.pop();
        }
      }

      localStorage.setItem(
        VERIFICATION_HISTORY_KEY,
        JSON.stringify(existingHistory)
      );
    } catch (error) {
      console.error("Error saving verification to local storage:", error);
    }
  }

  public getVerificationHistory(): StoredVerification[] {
    try {
      const historyJson = localStorage.getItem(VERIFICATION_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error("Error getting verification history:", error);
      return [];
    }
  }

  public clearVerificationHistory(): void {
    localStorage.removeItem(VERIFICATION_HISTORY_KEY);
  }

  private generateId(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private truncateContent(content: string, contentType: ContentType): string {
    if (contentType === ContentType.IMAGE) {
      return "[IMAGE DATA]";
    } else {
      const maxLength = 150;
      return content.length > maxLength
        ? content.substring(0, maxLength) + "..."
        : content;
    }
  }
}

const storageService = new StorageService();
export { storageService };
