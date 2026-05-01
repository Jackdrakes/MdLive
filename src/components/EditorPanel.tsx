"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, keymap } from "@codemirror/view";
import { EditorPanelProps } from "@/types";
import { useCallback, useRef } from "react";

export function EditorPanel({ value, onChange, onSave }: EditorPanelProps) {
  const editorRef = useRef<EditorView | null>(null);

  const handleSave = useCallback(() => {
    onSave?.();
  }, [onSave]);

  const customKeymap = keymap.of([
    {
      key: "Enter",
      run: (view) => {
        const state = view.state;
        const pos = state.selection.main.head;
        const line = state.doc.lineAt(pos);
        const lineText = line.text.trim();
        
        if (lineText === ":w") {
          view.dispatch({
            changes: { from: line.from, to: line.to, insert: "" },
            selection: { anchor: line.from }
          });
          onSave?.();
          return true;
        }
        return false;
      },
    },
  ]);

  const handleKeyDown = (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "s") {
      event.preventDefault();
      onSave?.();
    }
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <CodeMirror
        value={value}
        height="100%"
        theme={oneDark}
        extensions={[markdown(), customKeymap]}
        onChange={onChange}
        onCreateEditor={(editor) => {
          editorRef.current = editor;
          editor.dom.addEventListener("keydown", handleKeyDown);
        }}
        className="h-full text-sm"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightSelectionMatches: true,
        }}
      />
    </div>
  );
}