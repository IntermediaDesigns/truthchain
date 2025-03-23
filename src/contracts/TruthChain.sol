// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TruthChain
 * @dev Smart contract for storing and retrieving content verification records
 */
contract TruthChain {
    // Struct to store verification details
    struct VerificationRecord {
        bytes32 contentHash;       // Hash of the content being verified
        address verifier;          // Address that submitted the verification (could be your dApp address)
        uint256 timestamp;         // When the verification occurred
        bool isVerified;           // Whether the content was verified as authentic
        uint8 confidenceScore;     // Confidence score from 0-100
        string contentType;        // Type of content (text, image, video, etc.)
        string aiModelUsed;        // Name/version of AI model used for verification
    }

    // Mapping from content hash to verification record
    mapping(bytes32 => VerificationRecord) public verifications;
    
    // Array to store all content hashes for enumeration
    bytes32[] public allContentHashes;
    
    // Event emitted when new content is verified
    event ContentVerified(
        bytes32 indexed contentHash,
        address indexed verifier,
        bool isVerified,
        uint8 confidenceScore,
        uint256 timestamp
    );
    
    /**
     * @dev Verify content and store the result
     * @param contentHash Hash of the content
     * @param isVerified Whether the content passed verification
     * @param confidenceScore AI confidence score (0-100)
     * @param contentType Type of the content
     * @param aiModelUsed AI model used for verification
     */
    function verifyContent(
        bytes32 contentHash,
        bool isVerified,
        uint8 confidenceScore,
        string memory contentType,
        string memory aiModelUsed
    ) external {
        require(confidenceScore <= 100, "Confidence score must be between 0-100");
        
        // Check if this content has been verified before
        if (verifications[contentHash].timestamp == 0) {
            allContentHashes.push(contentHash);
        }
        
        // Create and store the verification record
        verifications[contentHash] = VerificationRecord({
            contentHash: contentHash,
            verifier: msg.sender,
            timestamp: block.timestamp,
            isVerified: isVerified,
            confidenceScore: confidenceScore,
            contentType: contentType,
            aiModelUsed: aiModelUsed
        });
        
        // Emit event
        emit ContentVerified(
            contentHash,
            msg.sender,
            isVerified,
            confidenceScore,
            block.timestamp
        );
    }
    
    /**
     * @dev Get verification record for content
     * @param contentHash Hash of the content
     * @return Verification record
     */
    function getVerification(bytes32 contentHash) external view 
        returns (
            address verifier,
            uint256 timestamp,
            bool isVerified,
            uint8 confidenceScore,
            string memory contentType,
            string memory aiModelUsed
        ) 
    {
        VerificationRecord memory record = verifications[contentHash];
        return (
            record.verifier,
            record.timestamp,
            record.isVerified,
            record.confidenceScore,
            record.contentType,
            record.aiModelUsed
        );
    }
    
    /**
     * @dev Get the total number of verifications
     * @return Total count of verified content
     */
    function getVerificationCount() external view returns (uint256) {
        return allContentHashes.length;
    }
    
    /**
     * @dev Get content hash at a specific index
     * @param index Index in the array
     * @return Content hash at the specified index
     */
    function getContentHashAtIndex(uint256 index) external view returns (bytes32) {
        require(index < allContentHashes.length, "Index out of bounds");
        return allContentHashes[index];
    }
}