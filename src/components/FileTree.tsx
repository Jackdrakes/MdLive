"use client";

import { useState, useRef, useEffect } from "react";
import { FolderIcon, FolderOpenIcon, FileText, ChevronRight, ChevronDown, ExternalLink } from "lucide-react";
import { FileNode } from "@/lib/fileSystem";

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (node: FileNode) => void;
  onOpenInNewTab?: (node: FileNode) => void;
  selectedFilePath: string | null;
}

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  onClose: () => void;
  onOpenInNewTab: (node: FileNode) => void;
}

function ContextMenu({ x, y, node, onClose, onOpenInNewTab }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [onClose]);

  const handleOpenInNewTab = () => {
    onOpenInNewTab(node);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-background-secondary border border-border rounded-md shadow-lg py-1 min-w-[160px]"
      style={{ left: x, top: y }}
    >
      <button
        onClick={handleOpenInNewTab}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-text-secondary hover:bg-background-tertiary hover:text-text-primary"
      >
        <ExternalLink className="w-4 h-4" />
        Open in new tab
      </button>
    </div>
  );
}

interface TreeItemProps {
  node: FileNode;
  level: number;
  onFileSelect: (node: FileNode) => void;
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void;
  selectedFilePath: string | null;
}

function TreeItem({ node, level, onFileSelect, onContextMenu, selectedFilePath }: TreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const isSelected = node.path === selectedFilePath;

  const handleClick = () => {
    if (node.isFolder) {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 cursor-pointer text-sm hover:bg-background-tertiary ${
          isSelected ? "bg-accent/20 text-accent" : "text-text-secondary"
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenu(e, node);
        }}
      >
        {node.isFolder ? (
          <>
            <span className="w-4 h-4 flex items-center justify-center">
              {isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </span>
            {isExpanded ? (
              <FolderOpenIcon className="w-4 h-4 text-yellow-400" />
            ) : (
              <FolderIcon className="w-4 h-4 text-yellow-400" />
            )}
          </>
        ) : (
          <span className="w-4" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      {node.isFolder && isExpanded && node.children && (
        <div>
          {node.children.map((child, index) => (
            <TreeItem
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              onContextMenu={onContextMenu}
              selectedFilePath={selectedFilePath}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, onFileSelect, onOpenInNewTab, selectedFilePath }: FileTreeProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: FileNode } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  const handleOpenInNewTab = (node: FileNode) => {
    if (node.isFolder || !node.handle) return;
    if (onOpenInNewTab) {
      onOpenInNewTab(node);
    }
  };

  if (files.length === 0) {
    return (
      <div className="p-4 text-sm text-text-secondary">
        No markdown files found in this folder
      </div>
    );
  }

  return (
    <div className="py-2" onClick={handleCloseMenu}>
      {files.map((node, index) => (
        <TreeItem
          key={`${node.path}-${index}`}
          node={node}
          level={0}
          onFileSelect={onFileSelect}
          onContextMenu={handleContextMenu}
          selectedFilePath={selectedFilePath}
        />
      ))}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={handleCloseMenu}
          onOpenInNewTab={handleOpenInNewTab}
        />
      )}
    </div>
  );
}