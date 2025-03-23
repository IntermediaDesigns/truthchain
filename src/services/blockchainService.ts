import { ethers } from "ethers";
import TruthChainABI from "../contracts/TruthChain.json";

// Replace this with your actual deployed contract address from Remix
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000"; // You'll update this

// Types to match the contract structure
export interface VerificationRecord {
  verifier: string;
  timestamp: number;
  isVerified: boolean;
  confidenceScore: number;
  contentType: string;
  aiModelUsed: string;
}

class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null;
  private contract: ethers.Contract | null = null;

  constructor() {
    // Initialize provider if window.ethereum is available
    if (typeof window !== "undefined" && window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    }
  }

  /**
   * Initialize the contract instance
   */
  private initContract() {
    if (!this.provider) {
      console.error("Provider not initialized");
      return false;
    }

    try {
      const signer = this.provider.getSigner();
      this.contract = new ethers.Contract(CONTRACT_ADDRESS, TruthChainABI.abi, signer);
      return true;
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      return false;
    }
  }

  /**
   * Generate a hash from content
   * @param content Content to hash (text, URL, or base64 encoded image)
   */
  public generateContentHash(content: string): string {
    return ethers.utils.id(content);
  }

  /**
   * Store verification result on the blockchain
   * @param content Original content (will be hashed)
   * @param isVerified Whether the content is verified as authentic
   * @param confidenceScore AI confidence score (0-100)
   * @param contentType Type of content (text, image, url)
   * @param aiModelUsed Name of AI model used for verification
   */
  public async verifyContent(
    content: string,
    isVerified: boolean,
    confidenceScore: number,
    contentType: string,
    aiModelUsed: string
  ): Promise<boolean> {
    if (!this.contract && !this.initContract()) {
      return false;
    }

    try {
      // Generate content hash
      const contentHash = ethers.utils.id(content);

      // Call the contract
      const tx = await this.contract!.verifyContent(
        contentHash,
        isVerified,
        confidenceScore,
        contentType,
        aiModelUsed
      );

      // Wait for transaction to be mined
      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to verify content:", error);
      return false;
    }
  }

  /**
   * Get verification record for content
   * @param content Content to check (will be hashed)
   */
  public async getVerification(content: string): Promise<VerificationRecord | null> {
    // Use a read-only provider if no MetaMask is available
    const readProvider = this.provider || new ethers.providers.JsonRpcProvider(
      import.meta.env.VITE_RPC_URL || "https://rpc.sepolia.org"
    );
    
    const readContract = new ethers.Contract(
      CONTRACT_ADDRESS, 
      TruthChainABI.abi, 
      readProvider
    );

    try {
      // Generate content hash
      const contentHash = ethers.utils.id(content);

      // Call the contract
      const result = await readContract.getVerification(contentHash);
      
      // Format the result
      return {
        verifier: result[0],
        timestamp: result[1].toNumber(),
        isVerified: result[2],
        confidenceScore: result[3],
        contentType: result[4],
        aiModelUsed: result[5]
      };
    } catch (error) {
      console.error("Failed to get verification:", error);
      return null;
    }
  }
}

// Create and export a singleton instance
const blockchainService = new BlockchainService();
export { blockchainService };