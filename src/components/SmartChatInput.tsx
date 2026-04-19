"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  X, 
  ChevronDown, 
  Send,
  MessageSquare,
  Swords,
  Flame,
  Brain,
  Search,
  Zap,
  Trophy,
  Eye
} from "lucide-react";
import { ModeType, MODES } from "@/lib/types";
import VoiceButton from "./VoiceButton";

interface SmartChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
  currentMode: ModeType;
  onModeChange: (mode: ModeType) => void;
}

const iconMap: Record<string, React.ElementType> = {
  MessageSquare,
  Swords,
  Flame,
  Brain,
  Search,
  Zap,
  Trophy,
  Eye,
};

// Chat modes (shown in dropdown)
const CHAT_MODES: ModeType[] = ['chat', 'debate', 'roast', 'explain', 'research', 'optimize', 'arena'];

export default function SmartChatInput({
  input,
  setInput,
  onSend,
  isLoading,
  currentMode,
  onModeChange,
}: SmartChatInputProps) {
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ file: File; preview: string } | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const attachmentRef = useRef<HTMLDivElement>(null);
  const modeDropdownRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (attachmentRef.current && !attachmentRef.current.contains(event.target as Node)) {
        setShowAttachmentMenu(false);
      }
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target as Node)) {
        setShowModeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (!input.trim() && !attachedImage && !attachedFile) return;
    onSend();
    // Clear attachments after send
    setAttachedImage(null);
    setAttachedFile(null);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachedImage({ file, preview: ev.target?.result as string });
      setAttachedFile(null);
    };
    reader.readAsDataURL(file);
    setShowAttachmentMenu(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Supported: .txt, .pdf, .js, .ts, .py, .md
    const supportedExts = ['.txt', '.pdf', '.js', '.ts', '.py', '.md'];
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!supportedExts.includes(ext) && !file.type.startsWith("text/")) {
      alert("Supported files: .txt, .pdf, .js, .ts, .py, .md");
      return;
    }
    setAttachedFile(file);
    setAttachedImage(null);
    setShowAttachmentMenu(false);
  };

  const clearAttachment = () => {
    setAttachedImage(null);
    setAttachedFile(null);
  };

  const getCurrentModeLabel = () => {
    return MODES.find(m => m.id === currentMode)?.label || 'Smart Chat';
  };

  const handleModeSelect = (mode: ModeType) => {
    onModeChange(mode);
    setShowModeDropdown(false);
  };

  return (
    <div className="mx-6 mb-6">
      {/* Attachment Preview */}
      {(attachedImage || attachedFile) && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]">
            {attachedImage ? (
              <>
                <img src={attachedImage.preview} alt="" className="w-6 h-6 rounded object-cover" />
                <span className="text-xs text-[var(--text-secondary)] truncate max-w-[150px]">
                  {attachedImage.file.name}
                </span>
              </>
            ) : (
              <>
                <FileText size={14} className="text-[var(--accent-primary)]" />
                <span className="text-xs text-[var(--text-secondary)] truncate max-w-[150px]">
                  {attachedFile?.name}
                </span>
              </>
            )}
            <button
              onClick={clearAttachment}
              className="p-0.5 rounded-full hover:bg-[var(--bg-primary)] text-[var(--text-muted)]"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Input Bar */}
      <div className="relative flex items-end gap-2 bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-2xl p-3">
        {/* Attachment Button */}
        <div className="relative" ref={attachmentRef}>
          <button
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all"
          >
            <Paperclip size={18} />
          </button>

          {/* Attachment Popup */}
          {showAttachmentMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-44 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl p-2 shadow-xl z-50">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-1">
                Attach
              </p>
              <button
                onClick={() => imageInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-all"
              >
                <ImageIcon size={16} />
                Upload Image
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-all"
              >
                <FileText size={16} />
                Upload File
              </button>
            </div>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.js,.ts,.py,.md,text/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message DevDebate..."
          className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)] text-[15px] placeholder-[var(--text-muted)] resize-none min-h-[24px] max-h-[200px] py-2"
          rows={1}
        />

        {/* Right Side Controls */}
        <div className="flex items-center gap-1.5">
          {/* Mode Selector */}
          <div className="relative" ref={modeDropdownRef}>
            <button
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--text-primary)] transition-all"
            >
              {getCurrentModeLabel()}
              <ChevronDown size={12} />
            </button>

            {/* Mode Dropdown */}
            {showModeDropdown && (
              <div className="absolute bottom-full right-0 mb-2 w-56 bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-xl p-2 shadow-xl z-50">
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-1.5">
                  Chat Modes
                </p>
                {CHAT_MODES.map((modeId) => {
                  const mode = MODES.find(m => m.id === modeId);
                  if (!mode) return null;
                  const Icon = iconMap[mode.icon];
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleModeSelect(mode.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] transition-all ${currentMode === mode.id
                          ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                      <Icon size={14} />
                      {mode.label}
                    </button>
                  );
                })}
                <div className="border-t border-[var(--border)] my-1.5" />
                <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-1.5">
                  Other
                </p>
                <button
                  onClick={() => handleModeSelect('vision')}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-[13px] transition-all ${currentMode === 'vision'
                      ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
                    }`}
                >
                  <Eye size={14} />
                  Vision Mode
                </button>
              </div>
            )}
          </div>

          {/* Voice Button */}
          <VoiceButton
            onTranscript={(text) => setInput(input + text)}
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !attachedImage && !attachedFile)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--accent-primary)] text-white hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} className="ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
