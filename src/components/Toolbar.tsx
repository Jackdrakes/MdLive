"use client";

import { useState } from "react";
import { FolderOpen, Save, Download, MoreVertical, Columns, FileText, Eye, GitCompare, Files, ChevronDown, Clock } from "lucide-react";
import { ToolbarProps, ViewMode } from "@/types";

const viewModes: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: "split", icon: <Columns className="w-4 h-4" />, label: "Split" },
  { mode: "editor", icon: <FileText className="w-4 h-4" />, label: "Editor" },
  { mode: "preview", icon: <Eye className="w-4 h-4" />, label: "Preview" },
  { mode: "diff", icon: <GitCompare className="w-4 h-4" />, label: "Diff" },
];

export function Toolbar({
  onOpen,
  onOpenFolder,
  onOpenRecentFolder,
  onOpenRecentFile,
  onSave,
  onSaveAs,
  onExport,
  fileName,
  folderName,
  isSaved,
  viewMode,
  onViewModeChange,
  hasOriginal,
  showFileTree,
  onToggleFileTree,
  recentFolders,
  recentFiles,
}: ToolbarProps) {
  const [showOpenMenu, setShowOpenMenu] = useState(false);
  const [showRecentMenu, setShowRecentMenu] = useState(false);

  return (
    <div className="flex items-center justify-between h-12 px-4 bg-background-secondary border-b border-border">
      <div className="flex items-center gap-1">
        {/* Explorer Toggle - First Icon */}
        <button
          onClick={onToggleFileTree}
          title="Toggle Explorer"
          className={`p-2 rounded-md transition-colors ${
            showFileTree 
              ? "bg-accent text-white" 
              : "bg-background-tertiary hover:bg-border text-text-secondary"
          }`}
        >
          <Files className="w-4 h-4" />
        </button>

        {/* Open Dropdown */}
        <div className="relative group">
          <button
            onClick={() => setShowOpenMenu(!showOpenMenu)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm bg-background-tertiary hover:bg-border rounded-md transition-colors ${folderName || fileName ? "text-accent" : ""}`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Open</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <div className={`absolute top-full left-0 mt-1 bg-background-tertiary border border-border rounded-md shadow-lg z-10 min-w-[180px] ${
            showOpenMenu ? "opacity-100 visible" : "opacity-0 invisible"
          } transition-all`}>
            <button
              onClick={() => {
                onOpen();
                setShowOpenMenu(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-border whitespace-nowrap"
            >
              Open File...
            </button>
            <button
              onClick={() => {
                onOpenFolder();
                setShowOpenMenu(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-border whitespace-nowrap"
            >
              Open Folder...
            </button>
            {(recentFolders.length > 0 || recentFiles.length > 0) && (
              <>
                <div className="border-t border-border my-1" />
                <div className="px-4 py-1 text-xs text-text-secondary uppercase">Recent</div>
                {recentFiles.map((file, index) => (
                  <button
                    key={`file-${index}`}
                    onClick={() => {
                      onOpenRecentFile(file);
                      setShowOpenMenu(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-border whitespace-nowrap flex items-center gap-2"
                  >
                    <FileText className="w-3 h-3 text-text-secondary" />
                    <span className="truncate">{file.name}</span>
                  </button>
                ))}
                {recentFolders.map((folder, index) => (
                  <button
                    key={`folder-${index}`}
                    onClick={() => {
                      onOpenRecentFolder(folder.name);
                      setShowOpenMenu(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm hover:bg-border whitespace-nowrap flex items-center gap-2"
                  >
                    <FolderOpen className="w-3 h-3 text-yellow-400" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={!fileName && !folderName}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-background-tertiary hover:bg-border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save</span>
        </button>

        {/* Save As */}
        <button
          onClick={onSaveAs}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-background-tertiary hover:bg-border rounded-md transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Save As</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-background-tertiary hover:bg-border rounded-md transition-colors">
            <MoreVertical className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
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
        
        {/* View Modes */}
        <div className="flex items-center gap-1 ml-2 px-2 border-l border-border">
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
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-text-secondary">
          {folderName && <span className="text-accent">{folderName}</span>}
          {fileName && ` / ${fileName}`}
          {!folderName && !fileName && "No file"}
          {fileName && !isSaved && " *"}
        </span>
      </div>
    </div>
  );
}