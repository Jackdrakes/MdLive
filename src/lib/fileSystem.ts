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