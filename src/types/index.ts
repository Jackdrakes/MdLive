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
  scrollToLine?: () => number | undefined;
}

export interface PreviewPanelProps {
  markdown: string;
  onCheckChange?: (lineIndex: number, checked: boolean) => void;
  onNavigateToLine?: (lineIndex: number) => void;
  isSplitMode?: boolean;
}

export interface ToolbarProps {
  onOpen: () => void;
  onOpenFolder: () => void;
  onOpenRecentFolder: (name: string) => void;
  onOpenRecentFile: (item: { name: string; path: string }) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: (type: "html" | "pdf") => void;
  fileName: string | null;
  folderName: string | null;
  isSaved: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  hasOriginal: boolean;
  showFileTree: boolean;
  onToggleFileTree: () => void;
  recentFolders: { name: string; timestamp: number }[];
  recentFiles: { name: string; path: string; timestamp: number }[];
}

export interface StatusBarProps {
  fileName: string | null;
  isSaved: boolean;
  wordCount: number;
  charCount: number;
  hasChanges: boolean;
  isLoading?: boolean;
}

export interface DropZoneProps {
  isDragging: boolean;
  onDrop: (files: FileList, items?: DataTransferItem[]) => void;
}