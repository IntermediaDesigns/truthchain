import { ethers } from "ethers";
import { ContentType } from "../services/aiService";

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
}

export function formatContentHash(hash: string): string {
  if (!hash || hash.length < 10) return hash;
  return `${hash.substring(0, 10)}...${hash.substring(hash.length - 8)}`;
}

export function validateContent(
  content: string,
  contentType: ContentType
): boolean {
  switch (contentType) {
    case ContentType.TEXT:
      return content.trim().length > 0;

    case ContentType.URL:
      try {
        new URL(content);
        return true;
      } catch (e) {
        return false;
      }

    case ContentType.IMAGE:
      return content.startsWith("data:image/");

    default:
      return false;
  }
}

export function generateContentHash(content: string): string {
  return ethers.utils.id(content);
}

export function calculateStats(verifications: any[]): {
  totalVerifications: number;
  verifiedContent: number;
  rejectedContent: number;
  avgConfidenceScore: number;
} {
  if (!verifications || verifications.length === 0) {
    return {
      totalVerifications: 0,
      verifiedContent: 0,
      rejectedContent: 0,
      avgConfidenceScore: 0,
    };
  }

  const totalVerifications = verifications.length;
  const verifiedContent = verifications.filter((v) => v.isVerified).length;
  const rejectedContent = totalVerifications - verifiedContent;
  const totalConfidence = verifications.reduce(
    (sum, v) => sum + v.confidenceScore,
    0
  );
  const avgConfidenceScore =
    Math.round((totalConfidence / totalVerifications) * 10) / 10;

  return {
    totalVerifications,
    verifiedContent,
    rejectedContent,
    avgConfidenceScore,
  };
}

export function getConfidenceColor(score: number, isVerified: boolean): string {
  if (isVerified) {
    if (score > 85) return "green-600";
    if (score > 70) return "green-500";
    return "green-400";
  } else {
    if (score < 30) return "red-600";
    if (score < 50) return "red-500";
    return "red-400";
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
