import { useState, useCallback } from "react";
import { 
  openFile as openFileFn, 
  saveFile as saveFileFn, 
  saveFileAs as saveFileAsFn,
  openFileFallback,
  isFileSystemSupported,
} from "@/lib/fileSystem";
import { DEFAULT_CONTENT } from "@/lib/constants";

export function useFileSystem() {
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [originalContent, setOriginalContent] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const openFile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const supported = isFileSystemSupported();
    
    if (!supported || useFallback) {
      try {
        const result = await openFileFallback();
        if (result) {
          setFileName(result.name);
          setContent(result.content);
          setOriginalContent(result.content);
          setIsSaved(true);
          setFileHandle(null);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const result = await openFileFn();
      if (result) {
        setFileHandle(result.handle);
        setFileName(result.name);
        setContent(result.content);
        setOriginalContent(result.content);
        setIsSaved(true);
      }
    } catch (err) {
      const error = err as Error;
      if (error.name === "AbortError") {
        // User cancelled - no error
      } else {
        // Try fallback
        setUseFallback(true);
        try {
          const fallbackResult = await openFileFallback();
          if (fallbackResult) {
            setFileName(fallbackResult.name);
            setContent(fallbackResult.content);
            setOriginalContent(fallbackResult.content);
            setIsSaved(true);
            setFileHandle(null);
          }
        } catch (fallbackErr) {
          setError((fallbackErr as Error).message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [useFallback]);

  const saveFile = useCallback(async () => {
    if (!fileHandle && !fileName) {
      await saveFileAs();
      return;
    }
    
    if (!fileHandle) {
      setError("Cannot save: No file handle. Use 'Save As' instead.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      await saveFileFn(fileHandle, content);
      setIsSaved(true);
      setOriginalContent(content);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [fileHandle, fileName, content]);

  const saveFileAs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const supported = isFileSystemSupported();
    
    if (!supported || useFallback) {
      const filename = fileName || "document.md";
      const blob = new Blob([content], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setIsSaved(true);
      setIsLoading(false);
      return;
    }

    try {
      const result = await saveFileAsFn();
      if (result) {
        await saveFileFn(result.handle, content);
        setFileHandle(result.handle);
        setFileName(result.name);
        setIsSaved(true);
        setOriginalContent(content);
      }
    } catch (err) {
      const error = err as Error;
      if (error.name !== "AbortError") {
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "document.md";
        a.click();
        URL.revokeObjectURL(url);
        setIsSaved(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [content, fileName, useFallback]);

  const loadContent = useCallback((newContent: string) => {
    setContent(newContent);
    setIsSaved(false);
  }, []);

  return {
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
  };
}