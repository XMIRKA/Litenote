import React from 'react';
import { Auth2 } from '../ui/auth-2';
import { X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 sm:top-4 sm:right-4 z-50 p-2 text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-full transition-colors cursor-pointer shadow-lg"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* React Bits Pro Auth 2 Split Block */}
        <Auth2
          initialMode={initialMode}
          onSuccess={onClose}
          isModal={true}
        />
      </div>
    </div>
  );
};
