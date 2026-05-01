"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Toolbar } from "@/components/Toolbar";
import { StatusBar } from "@/components/StatusBar";
import { DropZone } from "@/components/DropZone";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useAutoSave } from "@/hooks/useAutoSave";
import { isFileSystemSupported, readFileFromDrop, isMarkdownFile } from "@/lib/fileSystem";
import { countWords, countCharacters, exportAsHtml } from "@/lib/markdown";
import { BROWSER_NOT_SUPPORTED_MESSAGE } from "@/lib/constants";
import { toast } from "sonner";
import { ViewMode } from "@/types";

function DiffView({ original, current }: { original: string; current: string }) {
  const diffLines = useMemo(() => {
    const origLines = original.split("\n");
    const currLines = current.split("\n");
    const result: { type: "same" | "added" | "removed"; text: string }[] = [];
    
    const maxLen = Math.max(origLines.length, currLines.length);
    
    for (let i = 0; i < maxLen; i++) {
      const origLine = origLines[i] ?? "";
      const currLine = currLines[i] ?? "";
      
      if (origLine === currLine) {
        result.push({ type: "same", text: origLine });
      } else if (i >= origLines.length) {
        result.push({ type: "added", text: currLine });
      } else if (i >= currLines.length) {
        result.push({ type: "removed", text: origLine });
      } else {
        result.push({ type: "removed", text: origLine });
        result.push({ type: "added", text: currLine });
      }
    }
    
    return result;
  }, [original, current]);

  return (
    <div className="h-full w-full overflow-auto bg-background-primary p-4 font-mono text-sm">
      <div className="space-y-1">
        {diffLines.map((line, i) => (
          <div
            key={i}
            className={`px-2 py-0.5 ${
              line.type === "added"
                ? "bg-green-900/30 text-green-400"
                : line.type === "removed"
                ? "bg-red-900/30 text-red-400"
                : "text-text-secondary"
            }`}
          >
            <span className="inline-block w-6 text-xs opacity-50">
              {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
            </span>
            {line.text || " "}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const {
    fileHandle,
    fileName,
    content,
    originalContent,
    isSaved,
    isLoading,
    error,
    openFile,
    saveFile,
    saveFileAs,
    loadContent,
  } = useFileSystem();

  const [isDragging, setIsDragging] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");

  const { isSaving } = useAutoSave({
    content,
    fileHandle,
    onSave: async (contentToSave) => {
      if (fileHandle) {
        const { saveFile: save } = await import("@/lib/fileSystem");
        await save(fileHandle, contentToSave);
      }
    },
  });

  useEffect(() => {
    if (typeof window !== "undefined" && !isFileSystemSupported()) {
      setShowBrowserWarning(true);
    }
  }, []);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleEditorChange = useCallback(
    (value: string) => {
      loadContent(value);
    },
    [loadContent]
  );

  const handleDrop = useCallback(
    async (files: FileList) => {
      setIsDragging(false);
      const file = files[0];
      if (!isMarkdownFile(file)) {
        toast.error("Please drop a valid markdown file (.md or .markdown)");
        return;
      }
      try {
        const fileContent = await readFileFromDrop(file);
        loadContent(fileContent);
        toast.success(`Loaded ${file.name}`);
      } catch (err) {
        toast.error("Failed to read file");
      }
    },
    [loadContent]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleExport = useCallback(
    (type: "html" | "pdf") => {
      if (type === "html") {
        exportAsHtml(content, fileName || "document.md");
        toast.success("Exported as HTML");
      } else if (type === "pdf") {
        window.print();
        toast.success("Use browser print to save as PDF");
      }
    },
    [content, fileName]
  );

  const hasChanges = originalContent !== null && content !== originalContent;
  const hasOriginal = originalContent !== null;

  const renderContent = () => {
    if (viewMode === "diff" && originalContent) {
      return (
        <DiffView original={originalContent} current={content} />
      );
    }

    return (
      <>
        {(viewMode === "split" || viewMode === "editor") && (
          <div className={`h-full ${viewMode === "split" ? "w-1/2 border-r border-border" : "w-full"}`}>
            <EditorPanel
              value={content}
              onChange={handleEditorChange}
              onSave={saveFile}
            />
          </div>
        )}
        {(viewMode === "split" || viewMode === "preview") && (
          <div className={`h-full ${viewMode === "split" ? "w-1/2" : "w-full"}`}>
            <PreviewPanel markdown={content} />
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className="flex flex-col h-screen"
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
    >
      {showBrowserWarning && (
        <div className="bg-warning/20 border-b border-warning px-4 py-2 text-sm text-warning text-center">
          {BROWSER_NOT_SUPPORTED_MESSAGE}
        </div>
      )}
      <Toolbar
        onOpen={openFile}
        onSave={saveFile}
        onSaveAs={saveFileAs}
        onExport={handleExport}
        fileName={fileName}
        isSaved={isSaved || isSaving}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasOriginal={hasOriginal}
      />
      <div className="flex flex-1 overflow-hidden">
        {renderContent()}
      </div>
      <StatusBar
        fileName={fileName}
        isSaved={isSaved || isSaving}
        wordCount={countWords(content)}
        charCount={countCharacters(content)}
        hasChanges={hasChanges}
      />
      <DropZone isDragging={isDragging} onDrop={handleDrop} />
    </div>
  );
}