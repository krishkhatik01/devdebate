'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-accent-green" />,
    error: <XCircle className="w-5 h-5 text-accent-red" />,
    info: <AlertCircle className="w-5 h-5 text-accent-cyan" />,
  };

  const borderColors = {
    success: 'border-accent-green/30',
    error: 'border-accent-red/30',
    info: 'border-accent-cyan/30',
  };

  const bgColors = {
    success: 'bg-accent-green/10',
    error: 'bg-accent-red/10',
    info: 'bg-accent-cyan/10',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl glass border ${borderColors[type]} shadow-lg transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
    >
      <div className={`p-1 rounded-lg ${bgColors[type]}`}>
        {icons[type]}
      </div>
      <p className="text-sm text-text-primary">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="p-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast container hook
import { useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ToastContainer = useCallback(() => (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  ), [toasts, removeToast]);

  return { showToast, ToastContainer };
}
