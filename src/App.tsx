import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ContentSubmission from "./components/ContentSubmission";
import VerificationResult from "./components/VerificationResult";
import BlockchainRecord from "./components/BlockchainRecord";
import AIAnalysis from "./components/AIAnalysis";
import {
  aiService,
  ContentType,
  VerificationResult as Result,
} from "./services/aiService";
import {
  blockchainService,
  VerificationRecord,
} from "./services/blockchainService";
import { storageService } from "./services/storageService";
import "./App.css";

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<ContentType>(
    ContentType.TEXT
  );
  const [verificationResult, setVerificationResult] = useState<Result | null>(
    null
  );
  const [blockchainRecord, setBlockchainRecord] =
    useState<VerificationRecord | null>(null);
  const [isStoredOnBlockchain, setIsStoredOnBlockchain] = useState(false);
  const [currentContent, setCurrentContent] = useState<string>("");
  const [contentHash, setContentHash] = useState<string>("");

  // Initialize AI service when component mounts
  useEffect(() => {
    const initAI = async () => {
      try {
        await aiService.initialize();
      } catch (error) {
        console.error("Failed to initialize AI:", error);
      }
    };

    initAI();
  }, []);

  // Handle content submission
  const handleContentSubmit = async (
    content: string,
    contentType: ContentType
  ) => {
    setIsProcessing(true);
    setCurrentContent(content);
    setSelectedContentType(contentType);
    setVerificationResult(null);
    setBlockchainRecord(null);
    setIsStoredOnBlockchain(false);

    // Generate content hash
    const hash = blockchainService.generateContentHash(content);
    setContentHash(hash);

    try {
      // First, check if this content has already been verified on the blockchain
      const existingRecord = await blockchainService.getVerification(content);

      if (existingRecord && existingRecord.timestamp > 0) {
        // Content was previously verified
        setBlockchainRecord(existingRecord);

        // Create a result object from the blockchain record
        setVerificationResult({
          isVerified: existingRecord.isVerified,
          confidenceScore: existingRecord.confidenceScore,
          aiModelUsed: existingRecord.aiModelUsed,
          explanation: `This content was previously verified ${
            existingRecord.isVerified
              ? "as authentic"
              : "as potentially misleading"
          }.`,
        });

        setIsStoredOnBlockchain(true);
      } else {
        // Content needs to be verified
        const result = await aiService.verifyContent(content, contentType);
        setVerificationResult(result);

        // Store the verification result on the blockchain
        const success = await blockchainService.verifyContent(
          content,
          result.isVerified,
          result.confidenceScore,
          contentType,
          result.aiModelUsed
        );

        if (success) {
          setIsStoredOnBlockchain(true);

          // Get the record back from the blockchain
          const record = await blockchainService.getVerification(content);
          setBlockchainRecord(record);

          // Save to local storage
          storageService.saveVerification(
            content,
            contentType,
            result.isVerified,
            result.confidenceScore,
            result.aiModelUsed,
            result.explanation
          );
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("An error occurred during verification. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Content type string representation
  const getContentTypeString = (type: ContentType): string => {
    switch (type) {
      case ContentType.TEXT:
        return "Text";
      case ContentType.IMAGE:
        return "Image";
      case ContentType.URL:
        return "URL";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Detect Misinformation with AI & Blockchain
            </h1>
            <p className="text-gray-600 mb-6">
              TruthChain uses AI to analyze content and stores verification
              records immutably on the blockchain. Submit text, an image, or a
              URL below to check its authenticity.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                </div>
                <h3 className="font-bold text-blue-700">Submit Content</h3>
                <p className="text-sm text-blue-600">
                  Upload text, images, or URLs for AI analysis
                </p>
              </div>

              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div className="bg-indigo-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                </div>
                <h3 className="font-bold text-indigo-700">AI Analysis</h3>
                <p className="text-sm text-indigo-600">
                  Advanced models detect patterns of misinformation
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    ></path>
                  </svg>
                </div>
                <h3 className="font-bold text-purple-700">
                  Blockchain Storage
                </h3>
                <p className="text-sm text-purple-600">
                  Verification records saved immutably on the blockchain
                </p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <ContentSubmission
              onSubmit={handleContentSubmit}
              isProcessing={isProcessing}
            />
          </div>

          {verificationResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <AIAnalysis
                result={verificationResult}
                isLoading={isProcessing}
              />

              <BlockchainRecord
                record={blockchainRecord}
                contentHash={contentHash}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;
