/**
 * Service for handling local storage operations
 * Used to store verification history and user preferences
 */

import { ContentType } from './aiService';

// Types
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

// Storage keys
const VERIFICATION_HISTORY_KEY = 'truthchain_verification_history';
const MAX_HISTORY_ITEMS = 10;

export class StorageService {
  /**
   * Save a verification result to local history
   */
  public saveVerification(
    content: string,
    contentType: ContentType,
    isVerified: boolean,
    confidenceScore: number,
    aiModelUsed: string,
    explanation: string
  ): void {
    try {
      // Generate a unique ID based on content hash
      const id = this.generateId(content);
      
      // Create the verification object
      const verification: StoredVerification = {
        id,
        content: this.truncateContent(content, contentType),
        contentType,
        timestamp: Date.now(),
        isVerified,
        confidenceScore,
        aiModelUsed,
        explanation
      };
      
      // Get existing history or initialize a new one
      const existingHistory = this.getVerificationHistory();
      
      // Check if this content has already been verified
      const existingIndex = existingHistory.findIndex(item => item.id === id);
      
      if (existingIndex !== -1) {
        // Update existing entry
        existingHistory[existingIndex] = verification;
      } else {
        // Add new entry, keeping only the most recent MAX_HISTORY_ITEMS
        existingHistory.unshift(verification);
        if (existingHistory.length > MAX_HISTORY_ITEMS) {
          existingHistory.pop();
        }
      }
      
      // Save back to local storage
      localStorage.setItem(VERIFICATION_HISTORY_KEY, JSON.stringify(existingHistory));
    } catch (error) {
      console.error('Error saving verification to local storage:', error);
    }
  }
  
  /**
   * Get the verification history
   */
  public getVerificationHistory(): StoredVerification[] {
    try {
      const historyJson = localStorage.getItem(VERIFICATION_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting verification history:', error);
      return [];
    }
  }
  
  /**
   * Clear verification history
   */
  public clearVerificationHistory(): void {
    localStorage.removeItem(VERIFICATION_HISTORY_KEY);
  }
  
  /**
   * Generate a unique ID for the content
   */
  private generateId(content: string): string {
    // Simple hash function for demo purposes
    // In a real app, use a proper hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  }
  
  /**
   * Truncate content for storage
   * For text and URLs, just truncate the string
   * For images, store a placeholder instead of the base64 data
   */
  private truncateContent(content: string, contentType: ContentType): string {
    if (contentType === ContentType.IMAGE) {
      // For images, store a placeholder instead of the actual base64 data
      return '[IMAGE DATA]';
    } else {
      // For text and URLs, truncate to a reasonable length
      const maxLength = 150;
      return content.length > maxLength
        ? content.substring(0, maxLength) + '...'
        : content;
    }
  }
}

// Export singleton instance
const storageService = new StorageService();
export { storageService };