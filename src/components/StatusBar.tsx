"use client";

import { CheckCircle, Circle, AlertCircle, Loader2 } from "lucide-react";
import { StatusBarProps } from "@/types";

export function StatusBar({
  fileName,
  isSaved,
  wordCount,
  charCount,
  hasChanges,
  isLoading,
}: StatusBarProps) {
  return (
    <div className="flex items-center justify-between h-8 px-4 bg-background-secondary border-t border-border text-xs text-text-secondary">
      <div className="flex items-center gap-4">
        <span>{fileName || "No file"}</span>
        <div className="flex items-center gap-1">
          {isLoading ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-accent" />
              <span className="text-accent">Loading...</span>
            </>
          ) : hasChanges && !isSaved ? (
            <>
              <AlertCircle className="w-3 h-3 text-warning" />
              <span className="text-warning">Modified</span>
            </>
          ) : isSaved ? (
            <>
              <CheckCircle className="w-3 h-3 text-success" />
              <span className="text-success">Saved</span>
            </>
          ) : (
            <>
              <Circle className="w-3 h-3 text-warning" />
              <span className="text-warning">Unsaved</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span>Words: {wordCount}</span>
        <span>Chars: {charCount}</span>
      </div>
    </div>
  );
}