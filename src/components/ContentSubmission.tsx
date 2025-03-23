import React, { useState, forwardRef, useImperativeHandle } from "react";
import { ContentType } from "../services/aiService";

export interface ContentSubmissionHandle {
  resetForm: () => void;
}

interface ContentSubmissionProps {
  onSubmit: (content: string, contentType: ContentType | null) => void;
  isProcessing: boolean;
}

const ContentSubmission = forwardRef<ContentSubmissionHandle, ContentSubmissionProps>(
  ({ onSubmit, isProcessing }, ref) => {
    const [contentType, setContentType] = useState<ContentType | null>(null);
    const [content, setContent] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const resetFormState = () => {
      setContentType(null);
      setContent("");
      setImagePreview(null);
    };

    useImperativeHandle(ref, () => ({
      resetForm: resetFormState
    }));

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      if (value === "select") {
        setContentType(null);
      } else {
        setContentType(value as ContentType);
      }
      setContent("");
      setImagePreview(null);
    };

    const handleContentChange = (
      e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
    ) => {
      setContent(e.target.value);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert("Image size exceeds 5MB limit.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImagePreview(result);
        setContent(result);
      };
      reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!contentType) {
        alert("Please select a content type.");
        return;
      }
      if (!content.trim()) {
        alert("Please enter or upload content to verify.");
        return;
      }
      onSubmit(content, contentType);
    };

    return (
      <div className="bg-white p-6 rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-100">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
          Verify Content
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="contentType"
              className="block text-gray-700 font-medium mb-2 dark:text-gray-300"
            >
              Content Type
            </label>
            <select
              id="contentType"
              value={contentType || "select"}
              onChange={handleTypeChange}
              className="w-full px-3 py-2 border cursor-pointer border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              disabled={isProcessing}
            >
              <option value="select">Select type</option>
              <option value={ContentType.TEXT}>Text</option>
              <option value={ContentType.IMAGE}>Image</option>
              <option value={ContentType.URL}>URL</option>
            </select>
          </div>

          {contentType === ContentType.TEXT && (
            <div className="mb-4">
              <label
                htmlFor="textContent"
                className="block text-gray-700 font-medium mb-2 dark:text-gray-300"
              >
                Text Content
              </label>
              <textarea
                id="textContent"
                value={content}
                onChange={handleContentChange}
                rows={5}
                placeholder="Enter the text content you want to verify..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                disabled={isProcessing}
              />
            </div>
          )}

          {contentType === ContentType.URL && (
            <div className="mb-4">
              <label
                htmlFor="urlContent"
                className="block text-gray-700 font-medium mb-2 dark:text-gray-300"
              >
                URL
              </label>
              <input
                id="urlContent"
                type="url"
                value={content}
                onChange={handleContentChange}
                placeholder="Enter the URL you want to verify..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              />
            </div>
          )}

          {contentType === ContentType.IMAGE && (
            <div className="mb-4">
              <label
                htmlFor="imageContent"
                className="block text-gray-700 font-medium mb-2 dark:text-gray-300"
              >
                Image
              </label>
              <div className="relative">
                <label
                  htmlFor="imageContent"
                  className="inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded cursor-pointer hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Choose File
                </label>
                <input
                  id="imageContent"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isProcessing}
                />
              </div>
              {imagePreview && (
                <div className="mt-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 rounded-md"
                  />
                </div>
              )}
            </div>
          )}

          {contentType && (
            <button
              type="submit"
              className={`w-full py-2 px-4 rounded-md text-white font-medium cursor-pointer ${
                isProcessing
                  ? "bg-gray-400 cursor-not-allowed dark:bg-gray-600"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
              }`}
              disabled={isProcessing}
            >
              {isProcessing ? "Verifying..." : "Verify Content"}
            </button>
          )}
        </form>
      </div>
    );
  }
);

export default ContentSubmission;
