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

declare global {
  interface Window {
    showOpenFilePicker(options?: FilePickerOptions): Promise<FileSystemFileHandle[]>;
    showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  }
}

export {};