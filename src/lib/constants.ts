export const FILE_TYPES = {
  MARKDOWN: {
    description: "Markdown Files",
    accept: {
      "text/markdown": [".md", ".markdown"],
      "text/plain": [".md", ".markdown"],
    },
  },
} as const;

export const AUTO_SAVE_DELAY = 2000;

export const MARKDOWN_DEBOUNCE = 200;

export const DEFAULT_CONTENT = `# Welcome to Modern Markdown Preview

This is a **live preview** editor where you can write and preview markdown in real-time.

## Features

- ✨ **Live Preview** - See your changes instantly
- 🔄 **Two-way Sync** - Edit and save directly to your local files
- 🎨 **Dark Mode** - Easy on the eyes
- 📁 **Drag & Drop** - Drop any .md file to open it

## Getting Started

1. Click the **Open** button or drag a markdown file here
2. Start editing in the left panel
3. See your preview in the right panel
4. Changes auto-save to your file (after 2 seconds of inactivity)

## Markdown Examples

### Text Formatting

*italic* or _italic_
**bold** or __bold__
~~strikethrough~~

### Lists

- Item 1
- Item 2
  - Nested item
- Item 3

### Task List

- [x] Completed task
- [ ] Pending task
- [ ] Another task

### Code

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

### Blockquotes

> This is a blockquote. It can span multiple lines.

### Tables

| Feature | Status |
|---------|--------|
| Editor | ✅ |
| Preview | ✅ |
| Auto-save | ✅ |

---

Happy writing! 🚀
`;

export const BROWSER_NOT_SUPPORTED_MESSAGE =
  "Two-way file sync is not supported in your browser. Please use Chrome or Edge for full functionality. You can still preview and download files, but edits won't sync to disk.";

export const ERROR_MESSAGES = {
  PERMISSION_DENIED: "Please grant file access permission",
  FILE_NOT_FOUND: "The file may have been moved or deleted",
  WRITE_FAILED: "Failed to save file. Please try again",
  UNEXPECTED: "An unexpected error occurred",
} as const;