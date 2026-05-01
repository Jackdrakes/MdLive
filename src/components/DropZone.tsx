"use client";

import { FileText, Folder } from "lucide-react";
import { DropZoneProps } from "@/types";

export function DropZone({ isDragging, onDrop }: DropZoneProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    const items = e.dataTransfer.items;
    
    if (files.length > 0) {
      const itemArray = items ? Array.from(items) : undefined;
      onDrop(files, itemArray);
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
        <div className="flex items-center gap-4">
          <FileText className="w-12 h-12 text-accent" />
          <Folder className="w-12 h-12 text-accent" />
        </div>
        <p className="text-lg text-text-primary font-medium">
          Drop markdown file or folder here
        </p>
        <p className="text-sm text-text-secondary">
          Supports .md, .markdown files and folders
        </p>
      </div>
    </div>
  );
}