# MdLive - Project Plan

## Project Location
```
/Documents/brain/Projects/modern-preview/
```

---

## 1. Overview

A Next.js-based markdown editor with live preview and two-way file system sync. Users can drag-and-drop local markdown files, edit them in real-time, and save changes directly back to their local file system. Dark mode only.

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + @tailwindcss/typography |
| Editor | CodeMirror 6 (@uiw/react-codemirror) |
| Markdown | react-markdown + remark-gfm + rehype-sanitize |
| Icons | Lucide React |
| Build | Turbopack |

---

## 3. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │               Next.js React App                    │ │
│  │  ┌──────────────┐    ┌────────────────────────┐   │ │
│  │  │ EditorPanel  │───▶│ PreviewPanel           │   │ │
│  │  │ (CodeMirror) │    │ (react-markdown)       │   │ │
│  │  └──────────────┘    └────────────────────────┘   │ │
│  │         ↓ ↑                  ↓                     │ │
│  │  ┌─────────────────────────────────────────────┐  │ │
│  │  │           FileSystemManager                  │  │ │
│  │  │  • showOpenFilePicker() → fileHandle        │  │ │
│  │  │  • createWritable() → save to disk          │  │ │
│  │  │  • watchForChanges() → polling (2s)        │  │ │
│  │  │  • Drag & Drop handler                       │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         ↓ (same behavior when deployed)
    User's browser accesses their own local files
```

---

## 4. Core Features

### 4.1 File Operations
| Feature | Implementation |
|---------|----------------|
| Drag & Drop | Native HTML5 drag-drop + File API |
| File Picker | `window.showOpenFilePicker()` with `.md` filter |
| Two-way Sync | `fileHandle.createWritable()` to save |
| Auto-save | Debounced save (2 seconds after last edit) |
| File Watch | Polling-based (check file every 2 seconds) |
| Save Indicator | Visual status: "Saved" / "Saving..." / "Unsaved" |

### 4.2 Editor
- CodeMirror 6 with markdown syntax highlighting
- Line numbers
- Dark theme (One Dark)
- Keyboard shortcuts: Ctrl+S (save), Ctrl+O (open file)
- Word/character count in footer

### 4.3 Preview
- GitHub Flavored Markdown (GFM)
- Syntax highlighting for code blocks
- Tables, task lists, strikethrough support
- Sanitized HTML (XSS protection via rehype-sanitize)

### 4.4 UI Layout
```
┌──────────────────────────────────────────────────────────┐
│ [Toolbar: Open | Save | Save As | Export | Theme]       │
├────────────────────────┬─────────────────────────────────┤
│                        │                                 │
│    Editor Panel        │       Preview Panel            │
│    (CodeMirror)        │       (Markdown render)        │
│                        │                                 │
│                        │                                 │
├────────────────────────┴─────────────────────────────────┤
│ [Status: filename.md | Saved | Words: 123 | Chars: 456] │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Browser Support

| Browser | Two-way Sync | Fallback |
|---------|---------------|----------|
| Chrome | ✅ Full | - |
| Edge | ✅ Full | - |
| Firefox | ❌ Not supported | Show warning + Download only |
| Safari | ❌ Not supported | Show warning + Download only |

---

## 6. File Structure

```
modern-preview/
├── plan.md                    # This plan
├── SPEC.md                    # Detailed specifications
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (dark theme)
│   │   ├── page.tsx          # Main editor page
│   │   ├── globals.css       # Global styles
│   │   └── api/
│   │       └── health/
│   │           └── route.ts  # Health check endpoint
│   │
│   ├── components/
│   │   ├── EditorPanel.tsx   # CodeMirror wrapper
│   │   ├── PreviewPanel.tsx # Markdown renderer
│   │   ├── Toolbar.tsx       # Action buttons
│   │   ├── StatusBar.tsx     # File status, word count
│   │   └── DropZone.tsx     # Drag & drop overlay
│   │
│   ├── lib/
│   │   ├── fileSystem.ts     # File System Access API wrapper
│   │   ├── markdown.ts       # Markdown processing
│   │   └── constants.ts      # App constants
│   │
│   ├── hooks/
│   │   ├── useFileSystem.ts  # File operations hook
│   │   └── useAutoSave.ts    # Auto-save hook
│   │
│   └── types/
│       └── index.ts          # TypeScript interfaces
│
├── public/
│   └── sample.md             # Default sample markdown
│
└── .env.local                # Environment variables (if needed)
```

---

## 7. Coding Patterns

### 7.1 Component Structure
- Functional components with TypeScript
- Props interface at top of each component file
- Use `use client` for components needing browser APIs

### 7.2 State Management
- React useState for local component state
- Custom hooks for business logic (file system, auto-save)
- No external state library needed (simple app)

### 7.3 Styling
- Tailwind CSS for all styling
- Dark mode: `bg-gray-900`, `text-gray-100`, `border-gray-700`
- No light mode classes
- @tailwindcss/typography for markdown prose

### 7.4 Error Handling
- Try-catch around all File System API calls
- User-friendly error toasts (sonner or similar)
- Browser support check on mount

### 7.5 Performance
- Debounced markdown rendering (200ms)
- Debounced auto-save (2s)
- React.memo for preview panel (prevent re-renders)

---

## 8. Implementation Phases

### Phase 1: Core (MVP)
- [ ] Setup Next.js 15 project with Tailwind
- [ ] Editor panel with CodeMirror
- [ ] Preview panel with react-markdown
- [ ] Basic drag & drop file loading
- [ ] Dark theme styling
- [ ] Save indicator

### Phase 2: Two-way Sync
- [ ] File System Access API integration
- [ ] Save/Save As functionality
- [ ] Auto-save with debounce
- [ ] File watching (polling)
- [ ] Keyboard shortcuts (Ctrl+S, Ctrl+O)

### Phase 3: Polish
- [ ] Browser compatibility warning
- [ ] Export (HTML, PDF)
- [ ] Toolbar with all actions
- [ ] Status bar (word/char count)
- [ ] Error handling & toasts

---

## 9. User Flow

1. **First Visit**: App loads with sample.md content
2. **Open File**: User clicks "Open" or drags .md file → File content loads in editor
3. **Edit**: User types → Preview updates in real-time (200ms debounce)
4. **Auto-save**: After 2s of no typing → Changes saved to original file
5. **Manual Save**: User presses Ctrl+S or clicks "Save" → Immediate save
6. **External Changes**: If file changed externally → Prompt to reload

---

## 10. Security Considerations

- HTML sanitization via `rehype-sanitize` to prevent XSS
- File System Access API requires user gesture (file picker)
- No server-side file operations (all client-side)
- No storage of credentials or sensitive data

---

## 11. Deployment

- Deploy to Vercel (Next.js default)
- Same functionality when deployed (browser-based, not server-based)
- Users access via their browser → picks files from their machine

---

## 12. Acceptance Criteria

- [ ] App loads without errors
- [ ] Drag & drop .md files works
- [ ] File picker opens and loads .md files
- [ ] Live preview updates as user types
- [ ] Two-way sync works (save edits to local file)
- [ ] Auto-save triggers after 2s of inactivity
- [ ] Dark mode only - no light mode
- [ ] Keyboard shortcuts work (Ctrl+S, Ctrl+O)
- [ ] Browser compatibility shown for unsupported browsers
- [ ] Status bar shows file name, save status, word count