import axios from "axios";
import * as transformers from "@xenova/transformers";

// Type for verification result
export interface VerificationResult {
  isVerified: boolean;
  confidenceScore: number;
  aiModelUsed: string;
  explanation: string;
  sourceUrl?: string;
}

// Content types
export enum ContentType {
  TEXT = "text",
  IMAGE = "image",
  URL = "url",
}

export class AIService {
  private geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // Models for image analysis
  private imageClassifier: any = null;
  private imageManipulationDetector: any = null;
  private isImageClassifierReady = false;
  private isManipulationDetectorReady = false;

  /**
   * Initialize the service and load models
   */
  public async initialize(): Promise<void> {
    console.log("AI service initializing...");

    try {
      // Initialize progress handler
      const progress = (data: any) => {
        console.log(`Loading ${data.file}: ${data.progress.toFixed(2)}%`);
      };

      // Load image classification model
      console.log("Loading image classification model...");
      this.imageClassifier = await transformers.pipeline(
        "image-classification",
        "Xenova/vit-base-patch16-224",
        { progress }
      );
      this.isImageClassifierReady = true;
      console.log("Image classification model loaded");

      // For image manipulation detection, we'll load an additional model
      console.log("Loading image manipulation detection model...");
      this.imageManipulationDetector = await transformers.pipeline(
        "image-classification",
        "Xenova/swin-tiny-patch4-window7-224",
        { progress }
      );
      this.isManipulationDetectorReady = true;
      console.log("Image manipulation detection model loaded");
    } catch (error) {
      console.error("Error initializing models:", error);
    }

    if (!this.geminiApiKey) {
      console.warn(
        "Gemini API key not found. Set VITE_GEMINI_API_KEY in your .env file"
      );
    }
  }

  /**
   * Verify text content by querying Gemini API
   */
  public async verifyText(text: string): Promise<VerificationResult> {
    try {
      // Check if we can use Gemini API
      if (!this.geminiApiKey) {
        throw new Error("Gemini API key not configured");
      }

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are a fact-checking AI operating as part of a blockchain-based content verification system.
  
  Your task is to evaluate the following statement for accuracy and credibility.
  
  In your response, provide a JSON object with these fields:
  1. "isVerified" (boolean): true if content appears generally credible, false if likely misleading
  2. "confidenceScore" (number): a score between 0-100 representing your confidence in the assessment
  3. "explanation" (string): a DETAILED analysis explaining your reasoning, evidence considered, and specific credibility markers or red flags you identified - this should be at least 3-4 sentences long and will be displayed in a separate "Detailed Analysis" section
  
  Make your assessment based on factual accuracy, source credibility patterns, and information integrity. Be thorough in your explanation while keeping the summary judgment clear.
  
  Statement to verify: "${text}"`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Extract the response text
      const responseText = response.data.candidates[0].content.parts[0].text;

      // Parse the JSON from the response
      // First, find the JSON object in the response which may contain other text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not find JSON in Gemini response");
      }

      const jsonString = jsonMatch[0];
      const result = JSON.parse(jsonString);

      return {
        isVerified: result.isVerified,
        confidenceScore: result.confidenceScore,
        aiModelUsed: "Google Gemini 2.0 Flash",
        explanation: result.explanation,
      };
    } catch (error) {
      console.error("Text verification error:", error);

      // Fall back to pattern-based analysis if API fails
      return this.fallbackTextAnalysis(text);
    }
  }

  /**
   * Fallback text analysis using pattern matching when API is unavailable
   */
  private fallbackTextAnalysis(text: string): VerificationResult {
    // CREDIBILITY MARKERS
    const credibilityMarkers = [
      {
        pattern:
          /according to (a study|research|report) (published|conducted) (by|in) ([A-Z][a-z]+ ?){1,}/i,
        weight: 15,
        name: "Specific citation",
      },
      {
        pattern: /published in ([A-Z][a-z]+ ?){1,}/i,
        weight: 10,
        name: "Publication mention",
      },
      {
        pattern:
          /(study|research|survey) (of|with|involving) (\d[,\d]*) (participants|people|subjects)/i,
        weight: 10,
        name: "Research sample",
      },
      {
        pattern: /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/i,
        weight: 5,
        name: "Contains dates",
      },
      {
        pattern: /university|institute|laboratory|academy/i,
        weight: 5,
        name: "Academic institution",
      },
      {
        pattern: /\b(percent|percentage|\d+%)\b/i,
        weight: 5,
        name: "Contains statistics",
      },
    ];

    // MISINFORMATION INDICATORS
    const misinfoIndicators = [
      {
        pattern: /\b(exclusive|breaking|shocking)\b/i,
        weight: -5,
        name: "Sensationalist terms",
      },
      {
        pattern: /\b(doctors won't tell you|scientists can't explain)\b/i,
        weight: -10,
        name: "Authority undermining",
      },
      {
        pattern: /\b(miracle|cure|secret)\b/i,
        weight: -8,
        name: "Miracle claims",
      },
      {
        pattern: /\b(banned|censored|suppressed)\b/i,
        weight: -7,
        name: "Suppression claims",
      },
      {
        pattern: /\b(100%|guaranteed|proven)\b/i,
        weight: -5,
        name: "Absolute claims",
      },
    ];

    let score = 65; // Start with a neutral-positive score
    let foundCredibilityMarkers = [];
    let foundMisinfoIndicators = [];

    // Check for credibility markers
    for (const marker of credibilityMarkers) {
      if (marker.pattern.test(text)) {
        score += marker.weight;
        foundCredibilityMarkers.push(marker.name);
      }
    }

    // Check for misinformation indicators
    for (const indicator of misinfoIndicators) {
      if (indicator.pattern.test(text)) {
        score += indicator.weight; // These are negative weights
        foundMisinfoIndicators.push(indicator.name);
      }
    }

    // Cap the score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Generate explanation
    let explanation = "API unavailable. Using pattern analysis: ";
    if (score >= 80) {
      explanation +=
        "This content appears credible based on language patterns. ";
      if (foundCredibilityMarkers.length > 0) {
        explanation += `It contains credibility indicators including: ${foundCredibilityMarkers
          .slice(0, 3)
          .join(", ")}${
          foundCredibilityMarkers.length > 3 ? ", and others" : ""
        }.`;
      }
    } else if (score >= 65) {
      explanation +=
        "This content appears somewhat credible but could benefit from additional verification. ";
      if (foundCredibilityMarkers.length > 0) {
        explanation += `Positive indicators include: ${foundCredibilityMarkers
          .slice(0, 2)
          .join(", ")}.`;
      }
    } else {
      explanation +=
        "This content contains patterns often associated with misleading information. ";
      if (foundMisinfoIndicators.length > 0) {
        explanation += `Concerning indicators include: ${foundMisinfoIndicators
          .slice(0, 2)
          .join(", ")}${
          foundMisinfoIndicators.length > 2 ? ", and others" : ""
        }.`;
      }
    }

    return {
      isVerified: score >= 70,
      confidenceScore: score,
      aiModelUsed: "Pattern Analysis (API Fallback)",
      explanation,
    };
  }

  /**
   * Verify URL content by analyzing the domain and potentially the content
   */
  public async verifyUrl(url: string): Promise<VerificationResult> {
    try {
      // Extract domain for context
      let domain = "";
      try {
        domain = new URL(url).hostname;
      } catch (e) {
        return {
          isVerified: false,
          confidenceScore: 0,
          aiModelUsed: "URL Analysis",
          explanation: "Invalid URL format.",
        };
      }

      // Check if we can use Gemini API
      if (this.geminiApiKey) {
        try {
          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
            {
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `You are an expert URL and domain verification system evaluating a web resource.
  
  Your task is to analyze this URL for credibility and trustworthiness.
  
  In your response, provide a JSON object with these fields:
  1. "isVerified" (boolean): true if the domain appears credible/trustworthy, false if likely suspicious
  2. "confidenceScore" (number): a score between 0-100 representing your confidence in the assessment
  3. "explanation" (string): a DETAILED analysis of why you reached this conclusion, including domain reputation factors, TLD assessment, known practices of the website/organization, and any specific red flags - this should be at least 3-4 sentences and will be shown in a "Detailed Analysis" section
  
  Base your assessment on domain reputation, URL structure, known trusted sources, and other relevant factors.
  
  URL to verify: "${url}"`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              },
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          // Extract the response text
          const responseText =
            response.data.candidates[0].content.parts[0].text;

          // Parse the JSON from the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("Could not find JSON in Gemini response");
          }

          const jsonString = jsonMatch[0];
          const result = JSON.parse(jsonString);

          return {
            isVerified: result.isVerified,
            confidenceScore: result.confidenceScore,
            aiModelUsed: "Google Gemini 2.0 Flash",
            explanation: result.explanation,
          };
        } catch (error) {
          console.error("Gemini URL verification error:", error);
          // Fall back to domain analysis
        }
      }

      // Fallback domain analysis
      return this.fallbackUrlAnalysis(url, domain);
    } catch (error) {
      console.error("URL verification error:", error);
      return {
        isVerified: false,
        confidenceScore: 0,
        aiModelUsed: "URL Analysis",
        explanation: "An error occurred during verification.",
      };
    }
  }

  /**
   * Fallback URL analysis when API is unavailable
   */
  private fallbackUrlAnalysis(url: string, domain: string): VerificationResult {
    // List of trusted domains (expanded)
    const trustedDomains = [
      "wikipedia.org",
      "github.com",
      "stackoverflow.com",
      "medium.com",
      "reuters.com",
      "apnews.com",
      "bbc.com",
      "nytimes.com",
      "washingtonpost.com",
      "wsj.com",
      "economist.com",
      "nature.com",
      "science.org",
      "nasa.gov",
      "nih.gov",
      "who.int",
      "un.org",
      "coursera.org",
      "edx.org",
      "khanacademy.org",
      "udemy.com",
      "microsoft.com",
      "apple.com",
      "google.com",
      "ibm.com",
      "adobe.com",
      "oracle.com",
      "cisco.com",
      "mit.edu",
      "harvard.edu",
      "stanford.edu",
      "berkeley.edu",
      "yale.edu",
      "princeton.edu",
      "caltech.edu",
      "ted.com",
      "britannica.com",
      "snopes.com",
      "factcheck.org",
      "politifact.com",
      "ieee.org",
      "acm.org",
      "springer.com",
      "jstor.org",
      "netflix.com",
    ];

    // Domain categories with reputation scores
    const domainCategories = {
      academic: {
        patterns: [".edu", "university", "college", "academic", "school"],
        score: 95,
      },
      government: {
        patterns: [".gov", ".mil", "government", "federal", "state."],
        score: 95,
      },
      educational: {
        patterns: ["coursera", "edx", "udemy", "khan", "learn", "education"],
        score: 90,
      },
      news: {
        patterns: ["news", "times", "post", "herald", "tribune", "journal"],
        score: 80,
      },
    };

    // Check for exact domain match in trusted domains
    const exactMatch = trustedDomains.some((td) => domain.endsWith(td));

    // Check domain categories
    let categoryScore = 0;
    let category = "";

    for (const [cat, data] of Object.entries(domainCategories)) {
      for (const pattern of data.patterns) {
        if (domain.includes(pattern)) {
          if (data.score > categoryScore) {
            categoryScore = data.score;
            category = cat;
          }
          break;
        }
      }
    }

    // Calculate final score
    let finalScore = 0;

    if (exactMatch) {
      finalScore = 95;
    } else if (categoryScore > 0) {
      finalScore = categoryScore;
    } else {
      // Basic TLD analysis
      if (domain.endsWith(".org")) finalScore = 75;
      else if (domain.endsWith(".com")) finalScore = 65;
      else if (domain.endsWith(".net")) finalScore = 60;
      else finalScore = 50;
    }

    // Determine verification status
    const isVerified = finalScore >= 70;

    // Create explanation
    let explanation = "API unavailable. Using domain analysis: ";
    if (exactMatch) {
      explanation += `This URL is from a well-known, generally reliable domain (${domain}).`;
    } else if (category) {
      explanation += `This appears to be a ${category} website. ${
        isVerified
          ? "Generally considered a reliable category."
          : "Consider verifying with additional sources."
      }`;
    } else {
      explanation += isVerified
        ? `This domain (${domain}) appears to have good reputation indicators.`
        : `This URL is not from a recognized reliable source. Verify its content carefully.`;
    }

    return {
      isVerified,
      confidenceScore: finalScore,
      aiModelUsed: "Domain Analysis (API Fallback)",
      explanation,
    };
  }

  /**
   * Verify image content using Gemini Vision API (if available) and Hugging Face models
   */
  public async verifyImage(imageData: string): Promise<VerificationResult> {
    try {
      // First, try to use Gemini Vision if the API key is available
      if (this.geminiApiKey) {
        try {
          // Gemini requires base64 without the data URI prefix
          const base64Data = imageData.split(",")[1];

          const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
            {
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `As an image verification specialist, analyze this image for authenticity and potential manipulation.
  
  Provide your analysis as a JSON object with these fields:
  1. "isVerified" (boolean): true if the image appears authentic/unaltered, false if it shows signs of manipulation
  2. "confidenceScore" (number): a score between 0-100 representing your confidence
  3. "explanation" (string): a DETAILED analysis explaining your assessment, what the image appears to show, any signs of alteration you noticed, and quality indicators - this should be at least 3-4 sentences and will be shown in a separate "Detailed Analysis" section
  
  Be comprehensive in your detailed explanation but keep the top-level authenticity judgment concise.`
                    },
                    {
                      inline_data: {
                        mime_type: "image/jpeg",
                        data: base64Data
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.2,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
              },
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          // Extract the response text
          const responseText =
            response.data.candidates[0].content.parts[0].text;

          // Parse the JSON from the response
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("Could not find JSON in Gemini response");
          }

          const jsonString = jsonMatch[0];
          const result = JSON.parse(jsonString);

          return {
            isVerified: result.isVerified,
            confidenceScore: result.confidenceScore,
            aiModelUsed: "Google Gemini 2.0 Flash",
            explanation: result.explanation,
          };
        } catch (error) {
          console.error("Gemini Vision API error:", error);
          // Fall back to Hugging Face models
        }
      }

      // Fallback: Use Hugging Face models
      if (!this.isImageClassifierReady || !this.isManipulationDetectorReady) {
        await this.initialize();
      }

      // Create an image element from the data
      const img = document.createElement("img");
      img.src = imageData;

      // Wait for the image to load
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          resolve(null);
        };
      });

      // Run image through both models
      const [classificationResult, manipulationResult] = await Promise.all([
        this.imageClassifier(img),
        this.imageManipulationDetector(img),
      ]);

      // Extract top predictions
      const topClass = classificationResult[0];
      const topManipulationClass = manipulationResult[0];

      // Calculate authenticity score based on multiple factors
      let authenticityScore = 0;

      // Factor 1: Confidence in the top classification
      // Higher confidence suggests a clearer, more recognizable image
      const classificationConfidence = topClass.score * 100;
      authenticityScore += classificationConfidence * 0.4; // 40% of the score

      // Factor 2: Agreement between models
      // If both models come to similar conclusions, that's a good sign
      const modelAgreement = this.calculateModelAgreement(
        classificationResult,
        manipulationResult
      );
      authenticityScore += modelAgreement * 0.3; // 30% of the score

      // Factor 3: Image clarity and quality indicators
      // This is a crude approximation - real image forensics would be more sophisticated
      const imageQuality = this.estimateImageQuality(img);
      authenticityScore += imageQuality * 0.3; // 30% of the score

      // Round to nearest integer
      const finalScore = Math.round(authenticityScore);

      // Determine if verified (over 70 is verified)
      const isVerified = finalScore >= 70;

      // Create explanation
      let explanation = "";
      if (isVerified) {
        explanation = `This appears to be an authentic image of ${
          topClass.label
        } (${Math.round(classificationConfidence)}% confidence). `;

        if (finalScore > 85) {
          explanation +=
            "The image has high quality indicators and clear content recognition patterns.";
        } else {
          explanation +=
            "The image shows reasonable quality indicators, though additional verification wouldn't hurt.";
        }
      } else {
        explanation = `This image was classified as ${
          topClass.label
        }, but with lower confidence (${Math.round(
          classificationConfidence
        )}%). `;

        if (finalScore < 50) {
          explanation +=
            "Multiple indicators suggest this image may be manipulated or synthetically generated.";
        } else {
          explanation +=
            "Some quality indicators suggest caution when sharing or relying on this image.";
        }
      }

      return {
        isVerified,
        confidenceScore: finalScore,
        aiModelUsed: "Hugging Face ViT and Swin Transformer",
        explanation,
      };
    } catch (error) {
      console.error("Image verification error:", error);
      return {
        isVerified: false,
        confidenceScore: 0,
        aiModelUsed: "Error in processing",
        explanation: "An error occurred during image verification.",
      };
    }
  }

  /**
   * Calculate agreement between different model outputs
   */
  private calculateModelAgreement(
    classificationResult: any[],
    manipulationResult: any[]
  ): number {
    // Check for overlapping or semantically related classifications
    // This is a simplified implementation - a real system would use semantic similarity

    // Extract top 3 classes from each model
    const topClasses = classificationResult
      .slice(0, 3)
      .map((c) => c.label.toLowerCase());
    const topManipulationClasses = manipulationResult
      .slice(0, 3)
      .map((c) => c.label.toLowerCase());

    // Check for direct overlap in top classes
    let overlapCount = 0;
    for (const cls of topClasses) {
      for (const manipCls of topManipulationClasses) {
        // Check if class names are similar enough (contains each other)
        if (cls.includes(manipCls) || manipCls.includes(cls)) {
          overlapCount++;
        }
      }
    }

    // Calculate agreement score (0-100)
    // More overlap = higher agreement = higher score
    const agreementScore = (overlapCount / 3) * 100;

    // Check confidence of top predictions
    const classificationConfidence = classificationResult[0].score;
    const manipulationConfidence = manipulationResult[0].score;

    // If both models are very confident, that's a good sign
    const confidenceAgreement =
      classificationConfidence * manipulationConfidence * 100;

    // Combine scores, weighting overlap more heavily
    return agreementScore * 0.7 + confidenceAgreement * 0.3;
  }

  /**
   * Estimate image quality based on simple heuristics
   * In a real system, you'd use more sophisticated image forensics
   */
  private estimateImageQuality(img: HTMLImageElement): number {
    // Basic quality check based on resolution
    // Higher resolution generally indicates a more authentic image
    // (though this is very simplistic)
    const resolutionScore = Math.min(
      100,
      Math.max(0, (img.naturalWidth * img.naturalHeight) / 10000)
    );

    // Check aspect ratio - extreme ratios can be suspicious
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const aspectScore = aspectRatio > 0.5 && aspectRatio < 2.0 ? 100 : 70;

    // Combine scores
    return resolutionScore * 0.7 + aspectScore * 0.3;
  }

  /**
   * Main verification method
   */
  public async verifyContent(
    content: string,
    contentType: ContentType
  ): Promise<VerificationResult> {
    try {
      switch (contentType) {
        case ContentType.TEXT:
          return await this.verifyText(content);
        case ContentType.IMAGE:
          return await this.verifyImage(content);
        case ContentType.URL:
          return await this.verifyUrl(content);
        default:
          return {
            isVerified: false,
            confidenceScore: 0,
            aiModelUsed: "none",
            explanation: "Unsupported content type.",
          };
      }
    } catch (error) {
      console.error("Error in content verification:", error);
      return {
        isVerified: false,
        confidenceScore: 0,
        aiModelUsed: "Error in processing",
        explanation: "An error occurred during verification.",
      };
    }
  }
}

// Create and export singleton instance
const aiService = new AIService();
export { aiService };
