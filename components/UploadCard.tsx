'use client';

import { useState, useRef, useEffect } from "react";
import { Upload, Sparkles, FileText, X, ArrowRight, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadCardProps {
  onFileSelect: (file: File) => void;
  onAnalyze: () => void;
  fileName: string;
  fileSize: string;
  file: File | null;
  isLoading: boolean;
  error: string;
}

export function UploadCard({
  onFileSelect,
  onAnalyze,
  fileName,
  fileSize,
  file,
  isLoading,
  error,
}: UploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check initial dark mode state
    const isDark = document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);

    // Listen for theme changes
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const handleDrag = (e: React.DragEvent, entering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(entering);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      onFileSelect(dropped);
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
    >
      <div className="relative rounded-2xl bg-card border border-border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)]">
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

        <div className="p-5 md:p-6">
          {/* Upload zone */}
          <div
            onDragEnter={(e) => handleDrag(e, true)}
            onDragOver={(e) => handleDrag(e, true)}
            onDragLeave={(e) => handleDrag(e, false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
              ${isDragging
                ? "border-primary bg-primary/[0.06] scale-[1.01]"
                : "border-border hover:border-primary/30 hover:bg-primary/[0.02]"
              }
            `}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={handleSelect}
              className="hidden"
            />

            <AnimatePresence mode="wait">
              {!file ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center py-10"
                >
                  <motion.div
                    animate={isDragging ? { scale: 1.15, rotate: -5 } : { scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center mb-4"
                  >
                    <Upload className="w-6 h-6 text-primary" />
                  </motion.div>

                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? "Release to upload" : "Drop your policy PDF here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    or{" "}
                    <span className="text-primary font-medium underline underline-offset-4 decoration-primary/30">
                      browse files
                    </span>
                  </p>

                  <div className="flex items-center gap-3 mt-4">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary">
                      <FileText className="w-3 h-3" />
                      PDF only
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-md bg-secondary">
                      Up to 10 MB
                    </span>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-4 py-6 px-5"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {fileSize} · Ready to analyze
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      inputRef.current?.click();
                    }}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-800 rounded-xl p-3.5 px-4 mt-4 text-[13px] text-red-700 dark:text-red-300"
            >
              <svg
                className="w-[16px] h-[16px] flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              {error}
            </motion.div>
          )}

          {/* Analyze button */}
          <motion.div
            className="relative mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Glow effect background - only shows when file is selected */}
            {file && !isLoading && (
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-black via-black to-gray-800 dark:from-white dark:via-white dark:to-gray-200 opacity-60 blur-lg"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}

            <motion.button
              whileHover={file ? { y: -2 } : {}}
              whileTap={file ? { y: 0 } : {}}
              onClick={onAnalyze}
              disabled={!file || isLoading}
              style={{
                backgroundColor: isDarkMode ? '#ffffff' : '#000000',
                color: isDarkMode ? '#000000' : '#ffffff',
              }}
              className="relative w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 overflow-hidden hover:shadow-2xl hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            >
              {/* Shimmer effect background */}
              {file && !isLoading && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
                  animate={{
                    x: ["100%", "-100%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    maskImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                  }}
                />
              )}

              {/* Button content */}
              <span className="relative flex items-center justify-center gap-2.5">
                <motion.div
                  animate={file && !isLoading ? { scale: [1, 1.1, 1] } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <span>Analyze Policy</span>
                {file && !isLoading && (
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                )}
              </span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
