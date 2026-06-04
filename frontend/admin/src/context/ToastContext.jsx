import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast('success', msg, duration),
    error: (msg, duration) => addToast('error', msg, duration),
    info: (msg, duration) => addToast('info', msg, duration),
    warning: (msg, duration) => addToast('warning', msg, duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-[380px] pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} removeToast={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const ToastItem = ({ toast, removeToast }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [progressWidth, setProgressWidth] = useState('100%');

  useEffect(() => {
    if (toast.duration !== Infinity) {
      // Start the progress bar transition shortly after mount
      const progressTimer = setTimeout(() => {
        setProgressWidth('0%');
      }, 50);

      const closeTimer = setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => removeToast(toast.id), 300); // Wait for exit animation
      }, toast.duration);

      return () => {
        clearTimeout(progressTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [toast, removeToast]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => removeToast(toast.id), 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={16} className="text-[#0070F3]" />;
      case 'error':
        return <AlertCircle size={16} className="text-[#E60000]" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-[#F5A623]" />;
      case 'info':
      default:
        return <Info size={16} className="text-[#3291FF]" />;
    }
  };

  return (
    <div
      className={`pointer-events-auto relative overflow-hidden flex items-start gap-3 p-3 bg-white border border-[#E5E5E5] rounded-lg shadow-[0_4px_6px_rgba(0,0,0,0.07),0_2px_4px_rgba(0,0,0,0.06)] transition-all duration-300 ease-out
      ${isLeaving ? 'opacity-0 translate-y-2' : 'animate-in fade-in slide-in-from-bottom-5'}`}
    >
      <div className="mt-0.5 shrink-0 z-10">{getIcon()}</div>
      <div className="flex-1 min-w-0 z-10">
        <p className="text-[13px] font-medium text-[#000000] leading-snug m-0 break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={handleClose}
        className="shrink-0 p-1 -m-1 text-[#737373] hover:text-[#000000] transition-colors rounded hover:bg-black/5 z-10"
      >
        <X size={14} />
      </button>

      {/* Progress Bar */}
      {toast.duration !== Infinity && (
        <div
          className="absolute bottom-0 left-0 h-[3px] bg-[#3291FF] transition-all ease-linear"
          style={{
            width: progressWidth,
            transitionDuration: `${toast.duration}ms`,
          }}
        />
      )}
    </div>
  );
};
