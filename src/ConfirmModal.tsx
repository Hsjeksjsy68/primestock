
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel,
  confirmText = "Confirm"
}: { 
  isOpen: boolean, 
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel: () => void,
  confirmText?: string
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border-2 border-neutral-800 p-8 relative">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-6 text-white">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <h2 className="text-2xl font-black uppercase tracking-tighter">{title}</h2>
        </div>
        
        <p className="text-neutral-400 mb-8">{message}</p>
        
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 bg-neutral-800 text-white font-black uppercase tracking-widest py-4 hover:bg-neutral-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="flex-1 bg-red-500 text-white font-black uppercase tracking-widest py-4 hover:bg-red-400 transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
