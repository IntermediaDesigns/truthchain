import { ethers } from "ethers";
import TruthChainABI from "../contracts/TruthChain.json";

const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000";
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
    if (typeof window !== "undefined" && window.ethereum) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);
    }
  }

  private initContract() {
    if (!this.provider) {
      console.error("Provider not initialized");
      return false;
    }

    try {
      const signer = this.provider.getSigner();
      this.contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        TruthChainABI.abi,
        signer
      );
      return true;
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      return false;
    }
  }

  public generateContentHash(content: string): string {
    return ethers.utils.id(content);
  }

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
      const contentHash = ethers.utils.id(content);

      const tx = await this.contract!.verifyContent(
        contentHash,
        isVerified,
        confidenceScore,
        contentType,
        aiModelUsed
      );

      await tx.wait();
      return true;
    } catch (error) {
      console.error("Failed to verify content:", error);
      return false;
    }
  }

  public async getVerification(
    content: string
  ): Promise<VerificationRecord | null> {
    const readProvider =
      this.provider ||
      new ethers.providers.JsonRpcProvider(
        import.meta.env.VITE_RPC_URL || "https://rpc.sepolia.org"
      );

    const readContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      TruthChainABI.abi,
      readProvider
    );

    try {
      const contentHash = ethers.utils.id(content);

      const result = await readContract.getVerification(contentHash);

      return {
        verifier: result[0],
        timestamp: result[1].toNumber(),
        isVerified: result[2],
        confidenceScore: result[3],
        contentType: result[4],
        aiModelUsed: result[5],
      };
    } catch (error) {
      console.error("Failed to get verification:", error);
      return null;
    }
  }
}

const blockchainService = new BlockchainService();
export { blockchainService };
