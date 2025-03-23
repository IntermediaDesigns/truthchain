import React from 'react';
import { VerificationResult as Result } from '../services/aiService';
import { VerificationRecord } from '../services/blockchainService';

interface VerificationResultProps {
  result: Result | null;
  blockchainRecord: VerificationRecord | null;
  contentType: string;
  isStoredOnBlockchain: boolean;
}

const VerificationResult: React.FC<VerificationResultProps> = ({
  result,
  blockchainRecord,
  contentType,
  isStoredOnBlockchain,
}) => {
  if (!result) return null;

  // Format timestamp from blockchain
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  // Get appropriate emoji
  const getStatusEmoji = (isVerified: boolean) => {
    return isVerified ? '✅' : '⚠️';
  };

  // Get background color based on result
  const getStatusBgColor = (isVerified: boolean, confidenceScore: number) => {
    if (isVerified) {
      // Green with varying intensity based on confidence
      return confidenceScore > 85 
        ? 'bg-green-100 border-green-500' 
        : 'bg-green-50 border-green-400';
    } else {
      // Red with varying intensity based on confidence
      return confidenceScore < 30 
        ? 'bg-red-100 border-red-500' 
        : 'bg-red-50 border-red-400';
    }
  };

  // Get text color
  const getTextColor = (isVerified: boolean) => {
    return isVerified ? 'text-green-800' : 'text-red-800';
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Verification Results</h2>
      
      {/* Verification Status */}
      <div 
        className={`p-4 mb-6 rounded-md border ${getStatusBgColor(
          result.isVerified, 
          result.confidenceScore
        )}`}
      >
        <div className="flex items-center">
          <span className="text-3xl mr-3">{getStatusEmoji(result.isVerified)}</span>
          <div>
            <h3 className={`text-xl font-bold ${getTextColor(result.isVerified)}`}>
              {result.isVerified ? 'Content Appears Authentic' : 'Potentially Misleading Content'}
            </h3>
            <p className={`${getTextColor(result.isVerified)}`}>
              {result.explanation}
            </p>
          </div>
        </div>
      </div>
      
      {/* Result Details */}
      <div className="bg-gray-50 p-4 rounded-md mb-4">
        <h3 className="font-bold text-gray-700 mb-2">Analysis Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Content Type</p>
            <p className="font-medium">{contentType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Confidence Score</p>
            <div className="flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                <div 
                  className={`h-2.5 rounded-full ${
                    result.isVerified ? 'bg-green-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${result.confidenceScore}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium">{result.confidenceScore}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">AI Model Used</p>
            <p className="font-medium">{result.aiModelUsed}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Blockchain Status</p>
            <p className="font-medium">
              {isStoredOnBlockchain 
                ? '✓ Stored on blockchain' 
                : '⏳ Not yet stored on blockchain'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Blockchain Record */}
      {blockchainRecord && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2">Blockchain Record</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-700">Verified On</p>
              <p className="font-medium">{formatDate(blockchainRecord.timestamp)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Verifier Address</p>
              <p className="font-medium text-xs break-all">{blockchainRecord.verifier}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationResult;