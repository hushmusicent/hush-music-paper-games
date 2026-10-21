import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[100] p-4">
      <div className="card max-w-[420px] w-full max-h-[85vh] overflow-y-auto mb-0 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {children}
      </div>
    </div>
  );
};
