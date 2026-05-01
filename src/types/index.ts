export type ViewMode = "split" | "editor" | "preview" | "diff";

export interface FileSystemHandle {
  name: string;
}

export interface UseFileSystemReturn {
  fileHandle: FileSystemFileHandle | null;
  fileName: string | null;
  content: string;
  originalContent: string | null;
  isSaved: boolean;
  isLoading: boolean;
  error: string | null;
  openFile: () => Promise<void>;
  saveFile: () => Promise<void>;
  saveFileAs: () => Promise<void>;
  loadContent: (content: string) => void;
}

export interface UseAutoSaveProps {
  content: string;
  fileHandle: FileSystemFileHandle | null;
  onSave: (content: string) => Promise<void>;
  delay?: number;
}

export interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
}

export interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}

export interface PreviewPanelProps {
  markdown: string;
}

export interface ToolbarProps {
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: (type: "html" | "pdf") => void;
  fileName: string | null;
  isSaved: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasOriginal: boolean;
}

export interface StatusBarProps {
  fileName: string | null;
  isSaved: boolean;
  wordCount: number;
  charCount: number;
  hasChanges: boolean;
}

export interface DropZoneProps {
  isDragging: boolean;
  onDrop: (files: FileList) => void;
}