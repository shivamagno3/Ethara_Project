import React from 'react';
import { AlertTriangle } from 'lucide-react';

function ConfirmModal({ isOpen, title, message, confirmLabel, onConfirm, onCancel, confirmVariant = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
      <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-lg shadow-xl">
        <div className="flex items-start gap-4">
          <div className={`p-2.5 rounded-md ${confirmVariant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 border-t border-slate-100 pt-4">
          <button onClick={onCancel} className="btn btn-secondary btn-sm">
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`btn btn-sm ${confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;