"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { EditorPanel } from "@/components/EditorPanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Toolbar } from "@/components/Toolbar";
import { StatusBar } from "@/components/StatusBar";
import { DropZone } from "@/components/DropZone";
import { FileTree } from "@/components/FileTree";
import { useFileSystem } from "@/hooks/useFileSystem";
import { useAutoSave } from "@/hooks/useAutoSave";
import { isFileSystemSupported, readFileFromDrop, isMarkdownFile, openFolder, readDirectory, readFileFromHandle, readDroppedDirectory, readDroppedDirectoryFromEntry, readFileFromDroppedEntry, FileNode } from "@/lib/fileSystem";
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
    setFileName,
    content,
    originalContent,
    isSaved,
    isLoading,
    setIsLoading,
    error,
    openFile,
    saveFile,
    saveFileAs,
    loadContent,
  } = useFileSystem();

  const [isDragging, setIsDragging] = useState(false);
  const [showBrowserWarning, setShowBrowserWarning] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [showFileTree, setShowFileTree] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [folderName, setFolderName] = useState<string | null>(null);
  const [folderHandle, setFolderHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [recentFolders, setRecentFolders] = useState<{ name: string; timestamp: number }[]>([]);
  const [recentFiles, setRecentFiles] = useState<{ name: string; path: string; timestamp: number }[]>([]);

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

  useEffect(() => {
    try {
      const savedFolders = localStorage.getItem("mdlive_recent_folders");
      if (savedFolders) {
        setRecentFolders(JSON.parse(savedFolders));
      }
      const savedFiles = localStorage.getItem("mdlive_recent_files");
      if (savedFiles) {
        setRecentFiles(JSON.parse(savedFiles));
      }
    } catch (e) {
      console.error("Failed to load recent items:", e);
    }
  }, []);

  const previousFileName = useRef<string | null>(null);
  useEffect(() => {
    if (fileName && fileName !== previousFileName.current && folderName === null && !selectedFilePath) {
      previousFileName.current = fileName;
      addToRecentFiles(fileName, "");
    }
  }, [fileName, folderName, selectedFilePath]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileId = params.get("openFile");
    
    if (fileId) {
      try {
        const fileData = sessionStorage.getItem(fileId);
        if (fileData) {
          const { name, content } = JSON.parse(fileData);
          loadContent(content);
          setFileName(name);
          sessionStorage.removeItem(fileId);
          window.history.replaceState({}, "", window.location.pathname);
          toast.success(`Opened ${name}`);
        }
      } catch (err) {
        toast.error("Failed to restore file from new tab");
      }
    }
  }, [loadContent]);

  const handleEditorChange = useCallback(
    (value: string) => {
      loadContent(value);
    },
    [loadContent]
  );

  const handleDrop = useCallback(
    async (files: FileList, items?: DataTransferItem[]) => {
      setIsDragging(false);
      
      try {
        if (files.length === 0 && !items) return;
        
        if (items && items.length > 0) {
          const item = items[0];
          const entry = item.webkitGetAsEntry?.();
          
          if (entry?.isDirectory) {
            const folderFiles = await readDroppedDirectoryFromEntry(entry, entry.name);
            if (folderFiles.length === 0) {
              toast.error("No markdown files found in this folder");
              return;
            }
            setFileTree(folderFiles);
            setFolderName(entry.name);
            setShowFileTree(true);
            
            const firstMdFile = findFirstMdFile(folderFiles);
            if (firstMdFile) {
              setSelectedFilePath(firstMdFile.path);
              loadContent(`# ${firstMdFile.name}\n\nSelect a file from the explorer to view its contents.`);
            }
            
            toast.success(`Loaded folder: ${entry.name} (${countMdFiles(folderFiles)} files)`);
            return;
          }
        }
        
        const file = files[0];
        if (!file) return;
        
        if (!isMarkdownFile(file)) {
          toast.error("Please drop a valid markdown file (.md or .markdown)");
          return;
        }
        
        const fileContent = await readFileFromDrop(file);
        loadContent(fileContent);
        setFileName(file.name);
        setFolderName(null);
        setFileTree([]);
        setSelectedFilePath(null);
        toast.success(`Loaded ${file.name}`);
      } catch (err) {
        console.error("Drop error:", err);
        toast.error("Failed to read file");
      }
    },
    [loadContent]
  );

  const addToRecentFiles = useCallback((name: string, path: string) => {
    const updated = [
      { name, path, timestamp: Date.now() },
      ...recentFiles.filter(f => f.name !== name)
    ].slice(0, 10);
    setRecentFiles(updated);
    localStorage.setItem("mdlive_recent_files", JSON.stringify(updated));
  }, [recentFiles]);

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

  const handleOpenFolder = useCallback(async () => {
    if (!isFileSystemSupported()) {
      toast.error("File System Access API not supported in this browser");
      return;
    }
    
    try {
      const result = await openFolder();
      if (result) {
        setFolderHandle(result.handle);
        setFolderName(result.name);
        
        const files = await readDirectory(result.handle);
        setFileTree(files);
        setShowFileTree(true);
        
        const updatedRecent = [
          { name: result.name, timestamp: Date.now() },
          ...recentFolders.filter(f => f.name !== result.name)
        ].slice(0, 10);
        setRecentFolders(updatedRecent);
        localStorage.setItem("mdlive_recent_folders", JSON.stringify(updatedRecent));
        
        toast.success(`Opened folder: ${result.name}`);
        
        if (files.length > 0 && !files[0].isFolder) {
          const firstFile = files[0];
          handleFileSelect(firstFile);
        } else if (files.length > 0 && files[0].isFolder && files[0].children) {
          const firstMdFile = findFirstMdFile(files[0].children);
          if (firstMdFile) {
            handleFileSelect(firstMdFile);
          }
        }
      }
    } catch (err) {
      const error = err as Error;
      if (error.name !== "AbortError") {
        toast.error("Failed to open folder");
      }
    }
  }, [recentFolders]);

  const handleOpenRecentFolder = useCallback(async (name: string) => {
    if (!isFileSystemSupported()) {
      toast.error("File System Access API not supported in this browser");
      return;
    }
    
    try {
      const result = await openFolder();
      if (result && result.name === name) {
        setFolderHandle(result.handle);
        setFolderName(result.name);
        
        const files = await readDirectory(result.handle);
        setFileTree(files);
        setShowFileTree(true);
        
        toast.success(`Opened folder: ${result.name}`);
        
        if (files.length > 0 && !files[0].isFolder) {
          const firstFile = files[0];
          handleFileSelect(firstFile);
        } else if (files.length > 0 && files[0].isFolder && files[0].children) {
          const firstMdFile = findFirstMdFile(files[0].children);
          if (firstMdFile) {
            handleFileSelect(firstMdFile);
          }
        }
      } else if (result) {
        toast.info(`Selected folder "${result.name}" but expected "${name}". Recent list will update after you reopen this folder.`);
        setFolderHandle(result.handle);
        setFolderName(result.name);
        const files = await readDirectory(result.handle);
        setFileTree(files);
        setShowFileTree(true);
      }
    } catch (err) {
      const error = err as Error;
      if (error.name !== "AbortError") {
        toast.error("Failed to open folder");
      }
    }
  }, []);

  const findFileByPath = (nodes: FileNode[], targetPath: string): FileNode | null => {
    for (const node of nodes) {
      if (node.path === targetPath) return node;
      if (node.children) {
        const found = findFileByPath(node.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const handleOpenRecentFile = useCallback(async (item: { name: string; path: string }) => {
    if (!item.path) {
      toast.info(`Opening "${item.name}"...`);
      openFile();
      return;
    }
    
    if (!fileTree || fileTree.length === 0) {
      toast.info(`Open a folder first to access "${item.name}"`);
      return;
    }
    
    const fileNode = findFileByPath(fileTree, item.path);
    if (fileNode && fileNode.handle) {
      try {
        const handleAny = fileNode.handle as any;
        let fileContent: string;
        
        if (handleAny.getFile) {
          const file = await handleAny.getFile();
          if (file.size > 5 * 1024 * 1024) {
            toast.warning("Large file detected - preview may be slow");
          }
          fileContent = await readFileFromHandle(handleAny);
        } else {
          fileContent = await readFileFromDroppedEntry(handleAny);
        }
        
        loadContent(fileContent);
        setFileName(fileNode.name);
        setSelectedFilePath(fileNode.path);
        toast.success(`Opened ${fileNode.name}`);
      } catch (err) {
        toast.error("Failed to open file");
      }
    } else {
      toast.info(`File "${item.name}" not found in current folder. It may have been moved or deleted.`);
    }
  }, [fileTree, loadContent, openFile]);

  const findFirstMdFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (!node.isFolder) return node;
      if (node.isFolder && node.children) {
        const found = findFirstMdFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const countMdFiles = (nodes: FileNode[]): number => {
    let count = 0;
    for (const node of nodes) {
      if (!node.isFolder) {
        count++;
      } else if (node.children) {
        count += countMdFiles(node.children);
      }
    }
    return count;
  };

  const handleCheckChange = useCallback((lineIndex: number, checked: boolean) => {
    const lines = content.split("\n");
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const regex = /^(\s*-\s*\[)[ x](\]\s*)/;
      const match = lines[lineIndex].match(regex);
      
      if (match) {
        const newCheckbox = checked ? "x" : " ";
        lines[lineIndex] = lines[lineIndex].replace(regex, `$1${newCheckbox}$2`);
        loadContent(lines.join("\n"));
      }
    }
  }, [content, loadContent]);

  const handleFileSelect = useCallback(async (node: FileNode) => {
    if (node.isFolder || !node.handle) return;
    
    setSelectedFilePath(node.path);
    setIsLoading(true);
    
    try {
      let fileContent: string;
      const handleAny = node.handle as any;
      
      if (handleAny.getFile) {
        const file = await handleAny.getFile();
        if (file.size > 5 * 1024 * 1024) {
          toast.warning("Large file detected - preview may be slow");
        }
        fileContent = await readFileFromHandle(handleAny);
      } else {
        fileContent = await readFileFromDroppedEntry(handleAny);
      }
      
      loadContent(fileContent);
      setFileName(node.name);
      addToRecentFiles(node.name, node.path);
    } catch (err) {
      toast.error("Failed to read file");
    } finally {
      setIsLoading(false);
    }
  }, [loadContent, addToRecentFiles]);

  const handleToggleFileTree = useCallback(() => {
    setShowFileTree(prev => !prev);
  }, []);

  const handleOpenInNewTab = useCallback(async (node: FileNode) => {
    if (node.isFolder || !node.handle) return;
    
    try {
      const handleAny = node.handle as any;
      let fileContent: string;
      
      if (handleAny.getFile) {
        const file = await handleAny.getFile();
        fileContent = await readFileFromHandle(handleAny);
      } else {
        fileContent = await readFileFromDroppedEntry(handleAny);
      }
      
      const fileData = {
        name: node.name,
        content: fileContent,
      };
      const fileId = `file_${Date.now()}`;
      sessionStorage.setItem(fileId, JSON.stringify(fileData));
      
      const baseUrl = window.location.origin;
      window.open(`${baseUrl}?openFile=${fileId}`, "_blank");
    } catch (err) {
      toast.error("Failed to open file in new tab");
    }
  }, []);

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
            <PreviewPanel markdown={content} onCheckChange={handleCheckChange} />
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
        onOpenFolder={handleOpenFolder}
        onOpenRecentFolder={handleOpenRecentFolder}
        onOpenRecentFile={handleOpenRecentFile}
        onSave={saveFile}
        onSaveAs={saveFileAs}
        onExport={handleExport}
        fileName={fileName}
        folderName={folderName}
        isSaved={isSaved || isSaving}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        hasOriginal={hasOriginal}
        showFileTree={showFileTree}
        onToggleFileTree={handleToggleFileTree}
        recentFolders={recentFolders}
        recentFiles={recentFiles}
      />
      <div className="flex flex-1 overflow-hidden">
        {showFileTree && (
          <div className="w-64 border-r border-border bg-background-secondary overflow-auto">
            <div className="py-2 px-3 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
              Explorer
            </div>
            <FileTree
              files={fileTree}
              onFileSelect={handleFileSelect}
              onOpenInNewTab={handleOpenInNewTab}
              selectedFilePath={selectedFilePath}
            />
          </div>
        )}
        {renderContent()}
      </div>
      <StatusBar
        fileName={fileName}
        isSaved={isSaved || isSaving}
        wordCount={countWords(content)}
        charCount={countCharacters(content)}
        hasChanges={hasChanges}
        isLoading={isLoading}
      />
      <DropZone isDragging={isDragging} onDrop={handleDrop} />
    </div>
  );
}