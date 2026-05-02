"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { PreviewPanelProps } from "@/types";
import { memo, useState } from "react";
import { Copy, Check } from "lucide-react";

function CheckboxInput({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="mr-2 cursor-pointer accent-accent"
    />
  );
}

function extractCodeFromPre(children: React.ReactNode): string {
  if (!children) return "";
  
  const getText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (!node) return "";
    
    if (Array.isArray(node)) {
      return node.map(getText).join("");
    }
    
    if (typeof node === "object" && node !== null && "props" in node) {
      const element = node as React.ReactElement<{ children?: React.ReactNode }>;
      return getText(element.props?.children);
    }
    
    return "";
  };
  
  return getText(children);
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded bg-background-tertiary hover:bg-border text-text-secondary hover:text-text-primary transition-colors"
      title="Copy code"
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
    </button>
  );
}

export const PreviewPanel = memo(function PreviewPanel({ markdown, onCheckChange }: PreviewPanelProps) {
  const lines = markdown.split("\n");
  const checkboxLines: number[] = [];
  lines.forEach((line, index) => {
    if (line.match(/^\s*-\s*\[[ x]\]\s/)) {
      checkboxLines.push(index);
    }
  });

  let checkboxIndex = 0;

  return (
    <div className="h-full w-full overflow-auto bg-background-secondary p-6">
      <div className="markdown-preview">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeHighlight, rehypeSanitize]}
          components={{
            table: ({ children, ...props }) => (
              <table className="overflow-x-auto" {...props}>{children}</table>
            ),
            pre: ({ children, ...props }) => {
              const codeText = extractCodeFromPre(children);
              return (
                <div className="relative group">
                  <pre {...props} className="relative">{children}</pre>
                  <CopyButton code={codeText} />
                </div>
              );
            },
            li: ({ children, ...props }) => {
              const htmlChildren = children as React.ReactNode;
              const hasCheckbox = String(children).includes("input type=\"checkbox\"");
              
              if (hasCheckbox && checkboxLines.includes(checkboxIndex)) {
                const lineIndex = checkboxLines[checkboxIndex];
                const isChecked = lines[lineIndex].includes("[x]");
                
                const handleCheckboxChange = (checked: boolean) => {
                  if (onCheckChange) {
                    onCheckChange(lineIndex, checked);
                  }
                };
                
                checkboxIndex++;
                
                return (
                  <li {...props}>
                    <CheckboxInput checked={isChecked} onChange={handleCheckboxChange} />
                    {htmlChildren}
                  </li>
                );
              }
              
              return <li {...props}>{children}</li>;
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
});