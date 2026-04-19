"use client";
import { useEffect } from "react";
import { X, AlertTriangle, Info, CheckCircle, Trash2 } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: "confirm" | "alert" | "success" | "danger";
  confirmText?: string;
  cancelText?: string;
}

export default function Modal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "confirm",
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const icons = {
    confirm: <Info size={20} className="text-[var(--accent-primary)]" />,
    alert: <AlertTriangle size={20} className="text-yellow-400" />,
    success: <CheckCircle size={20} className="text-green-400" />,
    danger: <Trash2 size={20} className="text-red-400" />,
  };

  const confirmBtnStyles = {
    confirm: "bg-[var(--accent-primary)] text-white hover:opacity-90",
    alert: "bg-yellow-500 text-white hover:opacity-90",
    success: "bg-green-500 text-white hover:opacity-90",
    danger: "bg-red-500 text-white hover:opacity-90",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[var(--bg-card)] 
          border border-[var(--border-strong)] rounded-2xl p-6
          shadow-2xl animate-in fade-in zoom-in duration-200"
        style={{
          animation: "modalIn 0.2s ease-out"
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg
            text-[var(--text-muted)] hover:text-[var(--text-primary)]
            hover:bg-[var(--bg-elevated)] transition-all"
        >
          <X size={16} />
        </button>

        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center
            ${type === "danger" ? "bg-red-500/15" :
              type === "success" ? "bg-green-500/15" :
                type === "alert" ? "bg-yellow-500/15" :
                  "bg-[var(--accent-primary)]/15"
            }`}>
            {icons[type]}
          </div>
          <h3 className="font-bold text-[var(--text-primary)] text-base">
            {title}
          </h3>
        </div>

        {/* Message */}
        <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed pl-12">
          {message}
        </p>

        {/* Buttons */}
        <div className="flex gap-3 justify-end">
          {onConfirm && (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium
                border border-[var(--border-strong)]
                text-[var(--text-secondary)] 
                hover:text-[var(--text-primary)]
                hover:border-[var(--border-strong)] transition-all"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium 
              transition-all ${confirmBtnStyles[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
