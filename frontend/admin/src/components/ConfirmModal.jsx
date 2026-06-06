import React from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel', 
  onConfirm, 
  onClose,
  isDanger = false 
}) {
  return (
    <div className="fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-bg border border-border rounded-md shadow-lg w-full max-w-[480px] flex flex-col animate-[modalIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold m-0 text-text-primary">{title}</h2>
          <button className="inline-flex items-center justify-center w-8 h-8 rounded text-text-muted hover:bg-surface hover:text-text-primary transition-colors" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        
        <div className="p-5 flex flex-col gap-4">
          <p className="text-sm text-text-primary">{message}</p>
        </div>
        
        <div className="px-5 py-3 border-t border-border bg-surface-alt rounded-b-md flex items-center justify-end gap-3">
          <button 
            type="button" 
            className="inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md bg-white border border-border text-text-primary hover:bg-surface transition-colors" 
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={`inline-flex items-center justify-center px-4 h-9 text-sm font-medium rounded-md text-white transition-colors ${
              isDanger 
                ? 'bg-geist-error hover:bg-red-700' 
                : 'bg-black hover:bg-neutral-800'
            }`} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
