export function isFileSystemSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "showOpenFilePicker" in window;
}

export function getBrowserName(): string {
  if (typeof window === "undefined") return "unknown";
  
  const ua = navigator.userAgent;
  if (ua.includes("Brave")) return "brave";
  if (ua.includes("Chrome")) return "chrome";
  if (ua.includes("Edg")) return "edge";
  if (ua.includes("Firefox")) return "firefox";
  if (ua.includes("Safari")) return "safari";
  return "unknown";
}

export function openFileFallback(): Promise<{ content: string; name: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,text/markdown,text/plain";
    
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      try {
        const content = await readFileFromDrop(file);
        resolve({ content, name: file.name });
      } catch {
        resolve(null);
      }
    };
    
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function openFile(): Promise<{
  handle: FileSystemFileHandle;
  content: string;
  name: string;
} | null> {
  if (!isFileSystemSupported()) {
    const browser = getBrowserName();
    if (browser === "brave") {
      throw new Error("File System Access API may be blocked. Please check Brave's settings: Settings → Privacy → Shields, or try disabling Shields for this site.");
    }
    throw new Error("File System Access API not supported in this browser");
  }

  try {
    const [fileHandle] = await window.showOpenFilePicker({
      types: [
        {
          description: "Markdown Files",
          accept: {
            "text/markdown": [".md", ".markdown"],
            "text/plain": [".md", ".markdown"],
          },
        },
      ],
      multiple: false,
    });

    const file = await fileHandle.getFile();
    const content = await file.text();

    return {
      handle: fileHandle,
      content,
      name: file.name,
    };
  } catch (err) {
    const error = err as Error;
    if (error.name === "AbortError") {
      return null;
    }
    const browser = getBrowserName();
    if (browser === "brave") {
      throw new Error("Brave blocked file access. Try disabling Shields or allowing file access in Brave settings.");
    }
    throw error;
  }
}

export async function saveFile(
  handle: FileSystemFileHandle,
  content: string
): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function saveFileAs(): Promise<{
  handle: FileSystemFileHandle;
  name: string;
} | null> {
  if (!isFileSystemSupported()) {
    throw new Error("File System Access API not supported in this browser");
  }

  try {
    const handle = await window.showSaveFilePicker({
      types: [
        {
          description: "Markdown Files",
          accept: {
            "text/markdown": [".md"],
          },
        },
      ],
    });

    return {
      handle,
      name: handle.name,
    };
  } catch (err) {
    const error = err as Error;
    if (error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}

export async function hasFileChanged(
  handle: FileSystemFileHandle,
  lastKnownSize: number
): Promise<boolean> {
  try {
    const file = await handle.getFile();
    return file.size !== lastKnownSize;
  } catch {
    return false;
  }
}

export async function readFileFromDrop(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function isMarkdownFile(file: File): boolean {
  const validExtensions = [".md", ".markdown"];
  const fileName = file.name.toLowerCase();
  return validExtensions.some((ext) => fileName.endsWith(ext));
}

export interface FileNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: FileNode[];
  handle?: FileSystemFileHandle | FileSystemDirectoryHandle;
}

export async function openFolder(): Promise<{
  handle: any;
  name: string;
} | null> {
  if (!isFileSystemSupported()) {
    throw new Error("File System Access API not supported in this browser");
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: "readwrite",
    });
    return {
      handle,
      name: handle.name,
    };
  } catch (err) {
    const error = err as Error;
    if (error.name === "AbortError") {
      return null;
    }
    throw error;
  }
}

export async function readDirectory(
  handle: any,
  basePath: string = ""
): Promise<FileNode[]> {
  const entries: FileNode[] = [];
  const validExtensions = [".md", ".markdown"];

  try {
    for await (const entry of handle.values()) {
      const entryPath = basePath ? `${basePath}/${entry.name}` : entry.name;

      if (entry.kind === "directory") {
        const children = await readDirectory(entry, entryPath);
        if (children.length > 0) {
          entries.push({
            name: entry.name,
            path: entryPath,
            isFolder: true,
            children,
            handle: entry,
          });
        }
      } else if (entry.kind === "file") {
        const ext = entry.name.toLowerCase().split(".").pop();
        if (ext && validExtensions.includes(`.${ext}`)) {
          entries.push({
            name: entry.name,
            path: entryPath,
            isFolder: false,
            handle: entry,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error reading directory:", err);
  }

  return entries.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });
}

export async function readFileFromHandle(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile();
  return await file.text();
}

interface DroppedEntry {
  name: string;
  isFolder: boolean;
}

export async function readDroppedDirectory(
  file: File,
  basePath: string = ""
): Promise<FileNode[]> {
  const entry = (file as any).webkitGetAsEntry?.();
  if (!entry || !entry.isDirectory) return [];
  return readDroppedDirectoryFromEntry(entry, basePath);
}

export async function readFileFromDroppedEntry(entry: any): Promise<string> {
  return new Promise((resolve, reject) => {
    entry.file((file: File) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    }, (err: any) => reject(err));
  });
}

export async function readDroppedDirectoryFromEntry(
  entry: any,
  basePath: string = ""
): Promise<FileNode[]> {
  const entries: FileNode[] = [];
  const validExtensions = [".md", ".markdown"];

  if (!entry.isDirectory) return [];

  const reader = entry.createReader();

  const readAllEntries = async (): Promise<any[]> => {
    return new Promise((resolve) => {
      const allEntries: any[] = [];
      
      const readNext = () => {
        reader.readEntries((results: any[]) => {
          if (results.length === 0) {
            resolve(allEntries);
          } else {
            allEntries.push(...results);
            readNext();
          }
        });
      };
      
      readNext();
    });
  };

  try {
    const allEntries = await readAllEntries();
    
    for (const e of allEntries) {
      const entryPath = basePath ? `${basePath}/${e.name}` : e.name;
      
      if (e.isDirectory) {
        const dirReader = e.createReader();
        
        const readChildEntries = (): Promise<any[]> => {
          return new Promise((resolve) => {
            dirReader.readEntries((results: any[]) => resolve(results));
          });
        };
        
        const childEntries = await readChildEntries();
        
        const validChildren: FileNode[] = [];
        for (const child of childEntries) {
          if (!child.isDirectory) {
            const ext = child.name.toLowerCase().split(".").pop();
            if (ext && validExtensions.includes(`.${ext}`)) {
              validChildren.push({
                name: child.name,
                path: `${entryPath}/${child.name}`,
                isFolder: false,
                handle: child,
              });
            }
          }
        }
        
        if (validChildren.length > 0) {
          entries.push({
            name: e.name,
            path: entryPath,
            isFolder: true,
            children: validChildren.sort((a, b) => a.name.localeCompare(b.name)),
          });
        }
      } else {
        const ext = e.name.toLowerCase().split(".").pop();
        if (ext && validExtensions.includes(`.${ext}`)) {
          entries.push({
            name: e.name,
            path: entryPath,
            isFolder: false,
            handle: e,
          });
        }
      }
    }
  } catch (err) {
    console.error("Error reading dropped directory:", err);
  }

  return entries.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });
}