// File System Access API type augmentation
// These extend the existing browser types

interface FilePickerOptions {
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  multiple?: boolean;
}

interface SaveFilePickerOptions {
  types?: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
}

interface DirectoryPickerOptions {
  id?: string;
  mode?: "read" | "readwrite";
}

declare global {
  interface File {
    webkitGetAsEntry(): FileSystemEntry | null;
  }
  
  interface FileSystemEntry {
    isFile: boolean;
    isDirectory: boolean;
    name: string;
    fullPath?: string;
  }

  interface Window {
    showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
    showDirectoryPicker(options?: DirectoryPickerOptions): Promise<any>;
  }
}

export {};