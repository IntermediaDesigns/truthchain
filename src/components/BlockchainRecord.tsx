import React, { useState, useEffect } from "react";
import { VerificationRecord } from "../services/blockchainService";
import { VerificationResult, ContentType } from "../services/aiService";

interface BlockchainRecordProps {
  record: VerificationRecord | null;
  contentHash?: string;
  aiResult?: VerificationResult | null;
  contentType?: ContentType | null;
}

const BlockchainRecord: React.FC<BlockchainRecordProps> = ({
  record,
  contentHash,
  aiResult,
  contentType,
}) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [mockRecord, setMockRecord] = useState<VerificationRecord | null>(null);

  useEffect(() => {
    if (!record && aiResult && contentHash) {
      setIsDemoMode(true);
      createMockRecord();
    } else {
      setIsDemoMode(false);
      setMockRecord(null);
    }
  }, [record, aiResult, contentHash, contentType]);

  const createMockRecord = () => {
    if (!aiResult || !contentHash) return;

    let contentTypeString = "text";
    if (contentType === ContentType.URL) {
      contentTypeString = "url";
    } else if (contentType === ContentType.IMAGE) {
      contentTypeString = "image";
    } else if (contentType === null) {
      contentTypeString = "unknown";
    }

    const mockBlockchainRecord: VerificationRecord = {
      verifier: "0x7Fc6397dD20B9e0bD5596b31FaDF9D7A1E482373",
      timestamp: Math.floor(Date.now() / 1000),
      isVerified: aiResult.isVerified,
      confidenceScore: aiResult.confidenceScore,
      contentType: contentTypeString,
      aiModelUsed: aiResult.aiModelUsed,
    };

    setMockRecord(mockBlockchainRecord);
  };

  const displayRecord = record || mockRecord;

  if (!displayRecord) {
    return (
      <div className="bg-gray-50 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-700 mb-4">
          Blockchain Record
        </h2>
        <p className="text-gray-500 italic">
          No blockchain record found for this content.
        </p>
      </div>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const fullAddress = (address: string) => {
    return address;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Blockchain Record
        </h2>
        <div className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full dark:bg-blue-900 dark:text-blue-100">
          {isDemoMode ? "Demo Mode" : "Ethereum"}
        </div>
      </div>

      {isDemoMode && (
        <div className="mb-4 bg-yellow-50 border border-yellow-100 p-3 rounded text-sm text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200">
          Running in demo mode: This record is simulated and not stored on the
          blockchain. Connect a wallet to enable actual blockchain storage.
        </div>
      )}

      {contentHash && (
        <div className="mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">
            Content Hash
          </p>
          <div className="flex items-center">
            <code className="bg-gray-100 p-2 rounded text-sm text-gray-800 overflow-x-auto flex-1 dark:bg-gray-900 dark:text-gray-300">
              {contentHash}
            </code>
            <button
              onClick={() => copyToClipboard(contentHash)}
              className="ml-2 p-1 text-gray-500 cursor-pointer hover:text-blue-500"
              title="Copy to clipboard"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 mb-1 dark:text-gray-400">
            Verification Status
          </p>
          <div
            className={`font-medium ${
              displayRecord.isVerified
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {displayRecord.isVerified ? "Verified ✓" : "Not Verified ✗"}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Confidence Score</p>
          <div className="font-medium">{displayRecord.confidenceScore}%</div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Content Type</p>
          <div className="font-medium">{displayRecord.contentType}</div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">AI Model</p>
          <div className="font-medium">{displayRecord.aiModelUsed}</div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Verified On</p>
          <div className="font-medium">
            {formatDate(displayRecord.timestamp)}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">Verifier</p>
          <div className="font-medium flex items-center">
            {formatAddress(displayRecord.verifier)}
            <button
              onClick={() =>
                copyToClipboard(fullAddress(displayRecord.verifier))
              }
              className="ml-2 p-1 text-gray-500 cursor-pointer hover:text-blue-500"
              title="Copy full address"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {!isDemoMode && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <a
            href={`https://sepolia.etherscan.io/address/${displayRecord.verifier}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            View on Etherscan
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default BlockchainRecord;
