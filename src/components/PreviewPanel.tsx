"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { PreviewPanelProps } from "@/types";
import React, { useMemo, useState } from "react";
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

export function PreviewPanel({ markdown, onCheckChange, onNavigateToLine, isSplitMode }: PreviewPanelProps) {
  const lines = markdown.split("\n");
  
  const checkboxData = useMemo(() => {
    const data: { lineIndex: number; checked: boolean }[] = [];
    lines.forEach((line, index) => {
      const match = line.match(/^(\s*)-\s*\[([ x])\]/);
      if (match) {
        data.push({
          lineIndex: index,
          checked: match[2] === "x",
        });
      }
    });
    return data;
  }, [markdown]);

  return (
    <div className="h-full w-full overflow-auto bg-background-secondary p-6">
      <div className="markdown-preview">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]} 
          rehypePlugins={[rehypeHighlight, rehypeSanitize]}
          components={{
            h1: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                console.log("Double click h1", { isSplitMode, hasNode: !!node, position: node?.position?.start?.line });
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <h1 {...props} onDoubleClick={handleDoubleClick}>{children}</h1>;
            },
            h2: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <h2 {...props} onDoubleClick={handleDoubleClick}>{children}</h2>;
            },
            h3: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <h3 {...props} onDoubleClick={handleDoubleClick}>{children}</h3>;
            },
            h4: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <h4 {...props} onDoubleClick={handleDoubleClick}>{children}</h4>;
            },
            h5: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <h5 {...props} onDoubleClick={handleDoubleClick}>{children}</h5>;
            },
            h6: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <h6 {...props} onDoubleClick={handleDoubleClick}>{children}</h6>;
            },
            p: ({ children, node, ...props }) => {
              const handleDoubleClick = (e: React.MouseEvent) => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return (
                <p {...props} onDoubleClick={handleDoubleClick} data-line={node?.position?.start?.line}>
                  {children}
                </p>
              );
            },
            span: ({ children, node, ...props }) => {
              const handleDoubleClick = (e: React.MouseEvent) => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  e.stopPropagation();
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <span {...props} onDoubleClick={handleDoubleClick}>{children}</span>;
            },
            a: ({ children, node, ...props }) => {
              const handleDoubleClick = (e: React.MouseEvent) => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  e.stopPropagation();
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <a {...props} onDoubleClick={handleDoubleClick}>{children}</a>;
            },
            strong: ({ children, node, ...props }) => {
              const handleDoubleClick = (e: React.MouseEvent) => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  e.stopPropagation();
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <strong {...props} onDoubleClick={handleDoubleClick}>{children}</strong>;
            },
            em: ({ children, node, ...props }) => {
              const handleDoubleClick = (e: React.MouseEvent) => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  e.stopPropagation();
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <em {...props} onDoubleClick={handleDoubleClick}>{children}</em>;
            },
            ul: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <ul {...props} onDoubleClick={handleDoubleClick}>{children}</ul>;
            },
            ol: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <ol {...props} onDoubleClick={handleDoubleClick}>{children}</ol>;
            },
            table: ({ children, ...props }) => (
              <table className="overflow-x-auto" {...props}>{children}</table>
            ),
            pre: ({ children, node, ...props }) => {
              const codeText = extractCodeFromPre(children);
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return (
                <div className="relative group" onDoubleClick={handleDoubleClick}>
                  <pre {...props} className="relative">{children}</pre>
                  <CopyButton code={codeText} />
                </div>
              );
            },
            code: ({ className, children, node, ...props }) => {
              const isInline = !className?.includes("language-");
              const handleDoubleClick = (e: React.MouseEvent) => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  e.stopPropagation();
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              if (isInline) {
                return <code {...props} onDoubleClick={handleDoubleClick}>{children}</code>;
              }
              return <code {...props}>{children}</code>;
            },
            blockquote: ({ children, node, ...props }) => {
              const handleDoubleClick = () => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              return <blockquote {...props} onDoubleClick={handleDoubleClick}>{children}</blockquote>;
            },
            li: ({ children, className, node, ...props }) => {
              const isTaskItem = className?.includes("task-list-item");
              
              const handleDoubleClick = (e: React.MouseEvent) => {
                if (isSplitMode && onNavigateToLine && node?.position?.start?.line) {
                  onNavigateToLine(node.position.start.line - 1);
                }
              };
              
              if (isTaskItem && node?.position && onCheckChange) {
                const lineIndex = node.position.start.line - 1;
                const checkboxInfo = checkboxData.find(cb => cb.lineIndex === lineIndex);
                
                if (checkboxInfo) {
                  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    onCheckChange(lineIndex, e.target.checked);
                  };
                  
                  const filteredChildren = React.Children.map(children, (child) => {
                    if (React.isValidElement(child) && child.type === "input") {
                      return null;
                    }
                    return child;
                  });
                  
                  return (
                    <li className={className} {...props}>
                      <input
                        type="checkbox"
                        checked={checkboxInfo.checked}
                        onChange={handleChange}
                        className="mr-2 cursor-pointer accent-accent"
                      />
                      {filteredChildren}
                    </li>
                  );
                }
              }
              
              return <li className={className} {...props} onDoubleClick={handleDoubleClick}>{children}</li>;
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}