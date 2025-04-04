import React from "react";
import { VerificationResult } from "../services/aiService";

interface AIAnalysisProps {
  result: VerificationResult | null;
  isLoading: boolean;
}

const AIAnalysis: React.FC<AIAnalysisProps> = ({ result, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-100">
  <h2 className="text-xl font-bold text-gray-800 mb-4 dark:text-gray-100">AI Analysis Results</h2>
        <div className="flex justify-center items-center py-8">
          <div className="loader">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        <p className="text-center text-gray-500">
          Processing content with AI models...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">AI Analysis</h2>
        <p className="text-gray-500 italic">
          Submit content to see AI analysis results.
        </p>
      </div>
    );
  }

  const getStatusEmoji = (isVerified: boolean) => {
    return isVerified ? "✅" : "⚠️";
  };

  const getStatusBgColor = (isVerified: boolean, confidenceScore: number) => {
    if (isVerified) {
      return confidenceScore > 85
        ? "bg-green-100 border-green-500"
        : "bg-green-50 border-green-400";
    } else {
      return confidenceScore < 30
        ? "bg-red-100 border-red-500"
        : "bg-red-50 border-red-400";
    }
  };

  const getTextColor = (isVerified: boolean) => {
    return isVerified ? "text-green-800" : "text-red-800";
  };

  const getVerificationSummary = (
    isVerified: boolean,
    confidenceScore: number
  ) => {
    if (isVerified) {
      if (confidenceScore > 90) {
        return "This content appears highly credible.";
      } else if (confidenceScore > 75) {
        return "This content seems reasonably credible.";
      } else {
        return "This content appears somewhat credible.";
      }
    } else {
      if (confidenceScore < 30) {
        return "This content shows strong indicators of being misleading.";
      } else if (confidenceScore < 50) {
        return "This content has several concerns about its accuracy.";
      } else {
        return "This content may contain questionable information.";
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        AI Analysis Results
      </h2>

      <div
        className={`p-4 mb-6 rounded-md border ${getStatusBgColor(
          result.isVerified,
          result.confidenceScore
        )}`}
      >
        <div className="flex items-center">
          <span className="text-3xl mr-3">
            {getStatusEmoji(result.isVerified)}
          </span>
          <div>
            <h3
              className={`text-xl font-bold ${getTextColor(result.isVerified)}`}
            >
              {result.isVerified
                ? "Content Appears Authentic"
                : "Potentially Misleading Content"}
            </h3>
            <p className={`${getTextColor(result.isVerified)}`}>
              {getVerificationSummary(
                result.isVerified,
                result.confidenceScore
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
        <h3 className="font-bold text-gray-700 mb-2">AI Model</h3>
        <div className="bg-gray-50 p-3 rounded-md dark:bg-gray-100">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-indigo-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span className="font-medium">{result.aiModelUsed}</span>
            </div>
          </div>
        </div>

        <div>
        <h3 className="font-bold text-gray-700 mb-2">Confidence Score</h3>
        <div className="bg-gray-50 p-3 rounded-md dark:bg-gray-100">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {result.confidenceScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full ${
                  result.isVerified ? "bg-green-600" : "bg-red-600"
                }`}
                style={{ width: `${result.confidenceScore}%` }}
              ></div>
            </div>
            <div className="mt-2 text-xs text-gray-700">
              {result.confidenceScore < 30 && "Low confidence"}
              {result.confidenceScore >= 30 &&
                result.confidenceScore < 70 &&
                "Medium confidence"}
              {result.confidenceScore >= 70 && "High confidence"}
            </div>
          </div>
        </div>

        <div>
        <h3 className="font-bold text-gray-700 mb-2 dark:text-gray-700">Detailed Analysis</h3>
        <div className="bg-gray-50 p-3 rounded-md dark:bg-gray-100 text-gray-700">
            <p className="text-gray-700 whitespace-pre-line">
              {result.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;
