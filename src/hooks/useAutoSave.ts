import { useEffect, useRef, useState } from "react";
import { AUTO_SAVE_DELAY } from "@/lib/constants";

interface UseAutoSaveProps {
  content: string;
  fileHandle: FileSystemFileHandle | null;
  onSave: (content: string) => Promise<void>;
  delay?: number;
}

export function useAutoSave({
  content,
  fileHandle,
  onSave,
  delay = AUTO_SAVE_DELAY,
}: UseAutoSaveProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef(content);

  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!fileHandle) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(contentRef.current);
        setLastSaved(new Date());
      } catch (err) {
        console.error("Auto-save failed:", err);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, fileHandle, onSave, delay]);

  return { isSaving, lastSaved };
}