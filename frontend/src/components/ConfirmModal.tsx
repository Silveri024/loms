import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-start gap-4 p-6 border-b border-dark-100">
          <div className={`p-3 rounded-full ${isDangerous ? 'bg-red-100' : 'bg-blue-100'}`}>
            <AlertTriangle className={`w-6 h-6 ${isDangerous ? 'text-red-600' : 'text-blue-600'}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
            <p className="text-sm text-dark-600 mt-1">{message}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-dark-400 hover:text-dark-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-3 p-6 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-dark-200 text-dark-700 hover:bg-dark-50 font-medium disabled:opacity-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-primary-600 hover:bg-primary-700'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
