"use client";

import { FolderOpen, Save, Download, MoreVertical, Columns, FileText, Eye, GitCompare } from "lucide-react";
import { ToolbarProps, ViewMode } from "@/types";

const viewModes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: "split", icon: <Columns className="w-4 h-4" />, label: "Split" },
  { mode: "editor", icon: <FileText className="w-4 h-4" />, label: "Editor" },
  { mode: "preview", icon: <Eye className="w-4 h-4" />, label: "Preview" },
  { mode: "diff", icon: <GitCompare className="w-4 h-4" />, label: "Diff" },
];

export function Toolbar({
  onOpen,
  onSave,
  onSaveAs,
  onExport,
  fileName,
  isSaved,
  viewMode,
  onViewModeChange,
  hasOriginal,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between h-12 px-4 bg-background-secondary border-b border-border">
      <div className="flex items-center gap-2">
        <button
          onClick={onOpen}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background-tertiary hover:bg-border rounded-md transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Open</span>
        </button>
        <button
          onClick={onSave}
          disabled={!fileName}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background-tertiary hover:bg-border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span>Save</span>
        </button>
        <button
          onClick={onSaveAs}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background-tertiary hover:bg-border rounded-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Save As</span>
        </button>
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm bg-background-tertiary hover:bg-border rounded-md transition-colors">
            <MoreVertical className="w-4 h-4" />
            <span>Export</span>
          </button>
          <div className="absolute top-full left-0 mt-1 bg-background-tertiary border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button
              onClick={() => onExport("html")}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-border whitespace-nowrap"
            >
              Export as HTML
            </button>
            <button
              onClick={() => onExport("pdf")}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-border whitespace-nowrap"
            >
              Export as PDF
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-4 px-2 border-l border-border">
          {viewModes.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              disabled={mode === "diff" && !hasOriginal}
              title={mode === "diff" && !hasOriginal ? "Load a file to enable diff" : label}
              className={`flex items-center gap-1.5 px-2 py-1 text-sm rounded-md transition-colors ${
                viewMode === mode 
                  ? "bg-accent text-white" 
                  : "bg-background-tertiary hover:bg-border disabled:opacity-30"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-secondary">
          {fileName || "No file"}
          {fileName && !isSaved && " *"}
        </span>
      </div>
    </div>
  );
}