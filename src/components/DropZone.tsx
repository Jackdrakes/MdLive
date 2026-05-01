"use client";

import { FileText } from "lucide-react";
import { DropZoneProps } from "@/types";

export function DropZone({ isDragging, onDrop }: DropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
    }
  };

  if (!isDragging) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background-primary/90 backdrop-blur-sm"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-4 p-12 border-2 border-dashed border-accent rounded-xl bg-background-secondary">
        <FileText className="w-16 h-16 text-accent" />
        <p className="text-lg text-text-primary font-medium">
          Drop markdown file here
        </p>
        <p className="text-sm text-text-secondary">
          Supports .md and .markdown files
        </p>
      </div>
    </div>
  );
}