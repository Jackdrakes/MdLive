# Modern Markdown Preview - Technical Specification

## 1. Project Setup

### 1.1 Package.json Dependencies
```json
{
  "name": "modern-preview",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.1.0",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "@uiw/react-codemirror": "^4.23.0",
    "@codemirror/lang-markdown": "^6.3.0",
    "@codemirror/theme-one-dark": "^6.1.2",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "rehype-sanitize": "^6.0.0",
    "lucide-react": "^0.460.0",
    "sonner": "^1.7.1"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "@tailwindcss/typography": "^0.5.15",
    "eslint": "^9.17.0",
    "eslint-config-next": "15.1.0"
  }
}
```

---

## 2. Component Specifications

### 2.1 EditorPanel Component
```typescript
interface EditorPanelProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: () => void;
}
```
- Uses CodeMirror 6 with `@codemirror/lang-markdown`
- Theme: `@codemirror/theme-one-dark`
- Line numbers enabled
- Word wrap enabled
- Font: monospace, 14px
- Height: 100% of container

### 2.2 PreviewPanel Component
```typescript
interface PreviewPanelProps {
  markdown: string;
}
```
- Uses `react-markdown` with `remark-gfm`
- Sanitized with `rehype-sanitize`
- Prose styling via `@tailwindcss/typography`
- Scroll sync with editor (optional)

### 2.3 Toolbar Component
```typescript
interface ToolbarProps {
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExport: (type: 'html' | 'pdf') => void;
  fileName: string | null;
  isSaved: boolean;
}
```
Buttons:
- Open (folder icon)
- Save (save icon)
- Save As (download icon)
- Export dropdown (download with arrow)

### 2.4 StatusBar Component
```typescript
interface StatusBarProps {
  fileName: string | null;
  isSaved: boolean;
  wordCount: number;
  charCount: number;
}
```
Display:
- File name (or "No file")
- Save status: "Saved ✓" / "Saving..." / "Unsaved ●"
- Word count
- Character count

### 2.5 DropZone Component
```typescript
interface DropZoneProps {
  isDragging: boolean;
  onDrop: (files: FileList) => void;
}
```
- Full-screen overlay when dragging
- Visual indicator: dashed border, "Drop markdown file here"
- Accepts `.md` and `.markdown` files

---

## 3. Hook Specifications

### 3.1 useFileSystem Hook
```typescript
interface UseFileSystemReturn {
  fileHandle: FileSystemFileHandle | null;
  fileName: string | null;
  content: string;
  isSaved: boolean;
  isLoading: boolean;
  error: string | null;
  openFile: () => Promise<void>;
  saveFile: () => Promise<void>;
  saveFileAs: () => Promise<void>;
  loadContent: (content: string) => void;
}
```
- Uses File System Access API
- Tracks file handle for save operations
- Error handling for unsupported browsers

### 3.2 useAutoSave Hook
```typescript
interface UseAutoSaveProps {
  content: string;
  fileHandle: FileSystemFileHandle | null;
  onSave: (content: string) => Promise<void>;
  delay?: number; // default: 2000ms
}

interface UseAutoSaveReturn {
  isSaving: boolean;
  lastSaved: Date | null;
}
```
- Debounced save after `delay` ms of inactivity
- Only saves if fileHandle exists
- Resets timer on content change

---

## 4. Utility Functions

### 4.1 fileSystem.ts
```typescript
// Check browser support
function isFileSystemSupported(): boolean;

// Open file picker
async function openFile(): Promise<{ handle: FileSystemFileHandle; content: string } | null>;

// Save to existing handle
async function saveFile(handle: FileSystemFileHandle, content: string): Promise<void>;

// Save as new file
async function saveFileAs(content: string): Promise<FileSystemFileHandle | null>;

// Check if file changed externally
async function hasFileChanged(handle: FileSystemFileHandle): Promise<boolean>;
```

### 4.2 markdown.ts
```typescript
// Process markdown with plugins
function processMarkdown(markdown: string): string;

// Count words
function countWords(text: string): number;

// Count characters
function countCharacters(text: string): number;
```

---

## 5. UI/UX Specifications

### 5.1 Color Palette (Dark Mode Only)
```css
--bg-primary: #0f172a;      /* slate-900 */
--bg-secondary: #1e293b;   /* slate-800 */
--bg-tertiary: #334155;     /* slate-700 */
--text-primary: #f1f5f9;   /* slate-100 */
--text-secondary: #94a3b8; /* slate-400 */
--border: #475569;          /* slate-600 */
--accent: #3b82f6;          /* blue-500 */
--success: #22c55e;        /* green-500 */
--warning: #f59e0b;         /* amber-500 */
--error: #ef4444;           /* red-500 */
```

### 5.2 Layout
- Split pane: 50% editor, 50% preview (resizable)
- Toolbar height: 48px
- Status bar height: 32px
- Panel gap: 1px (border)

### 5.3 Typography
- UI Font: system-ui, sans-serif
- Editor Font: 'JetBrains Mono', 'Fira Code', monospace
- Preview: @tailwindcss/typography defaults

### 5.4 Animations
- Drop zone fade-in: 150ms
- Status indicator transition: 200ms
- Panel resize: smooth

---

## 6. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + S | Save file |
| Ctrl/Cmd + O | Open file |
| Ctrl/Cmd + Shift + S | Save As |
| Ctrl/Cmd + E | Export HTML |

---

## 7. Browser Compatibility

### Supported
- Chrome 86+
- Edge 86+

### Not Supported (Show Warning)
- Firefox (all versions)
- Safari (all versions)

### Warning Message
```
Two-way file sync is not supported in your browser.
Please use Chrome or Edge for full functionality.
You can still preview and download files, but edits won't sync to disk.
```

---

## 8. Error Handling

### File System Errors
- Permission denied: "Please grant file access permission"
- File not found: "The file may have been moved or deleted"
- Write failed: "Failed to save file. Please try again"

### General Errors
- Network error: "An unexpected error occurred"
- Browser not supported: Show compatibility warning

---

## 9. Performance Targets

| Metric | Target |
|--------|--------|
| Initial load | < 2s |
| Preview render | < 100ms |
| Auto-save trigger | 2s after last keystroke |
| File open | < 500ms |

---

## 10. Security

- XSS prevention: All HTML sanitized with rehype-sanitize
- No external API calls with file content
- No credentials stored
- File access only via user-initiated actions