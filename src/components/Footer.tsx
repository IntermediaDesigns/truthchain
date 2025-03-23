import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white mt-12 py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-3">TruthChain</h3>
            <p className="text-gray-400">
              Combining AI and blockchain technology to combat misinformation and verify content authenticity.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-3">Features</h3>
            <ul className="space-y-2 text-gray-400">
              <li>AI-powered content analysis</li>
              <li>Blockchain verification records</li>
              <li>Text, image, and URL verification</li>
              <li>Transparent and decentralized</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-3">Technologies</h3>
            <ul className="space-y-2 text-gray-400">
              <li>React + TypeScript</li>
              <li>Transformers.js AI</li>
              <li>Ethereum blockchain</li>
              <li>Solidity smart contracts</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>Created for the AI + Blockchain Hackathon | {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;