"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import { FileText, Info } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
  file: File | null;
  onAnalyze: () => void;
}

export default function UploadZone({
  onFileSelect,
  loading,
  file,
  onAnalyze,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    validateAndSelect(file);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSelect(file);
    }
  };

  const validateAndSelect = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds 10MB limit");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Please upload a PDF file");
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="w-full space-y-4">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">Upload your Policy Document</p>
          <p className="text-sm text-blue-700 mt-1">
            The PDF your insurer sent after you purchased the policy not a brochure or claim form
          </p>
        </div>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-blue-400"
        }`}
      >
        {!file ? (
          <>
            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Upload your insurance policy PDF
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              PDF only · max 10MB
            </p>
            <label className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl font-medium cursor-pointer hover:bg-blue-600 transition-colors">
              Choose File
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </>
        ) : (
          <>
            <FileText className="mx-auto mb-4 text-blue-500" size={48} />
            <p className="text-gray-900 font-semibold mb-4">{file.name}</p>
            <button
              onClick={onAnalyze}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Analyzing your policy…
                </>
              ) : (
                "Analyze Policy"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
