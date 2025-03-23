import React from "react";
import ThemeToggle from "./ThemeToggle";

const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md dark:from-blue-800 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img
              src="/tclogo.png"
              alt="TruthChain Logo"
              className="h-20 w-20 mr-3 rounded-md"
            />
            <div>
              <h1 className="text-3xl font-bold">TruthChain</h1>
              <p className="text-blue-100 dark:text-blue-200">
                Decentralized Content Verification
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center bg-blue-800 bg-opacity-30 rounded-full px-4 py-1">
                <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                <span className="text-sm">Blockchain Active</span>
              </div>

              <div className="inline-flex items-center bg-indigo-800 bg-opacity-30 rounded-full px-4 py-1">
                <div className="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
                <span className="text-sm">AI Models Ready</span>
              </div>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
