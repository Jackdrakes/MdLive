"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import { PreviewPanelProps } from "@/types";
import { memo } from "react";

export const PreviewPanel = memo(function PreviewPanel({ markdown }: PreviewPanelProps) {
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
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
});