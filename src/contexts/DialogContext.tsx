import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Modal } from '../components/Modal';

interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isAlert?: boolean;
}

interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: DialogOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [resolveFn, setResolveFn] = useState<(value: boolean) => void>();

  const confirm = (options: DialogOptions): Promise<boolean> => {
    setOptions(options);
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveFn(() => resolve);
    });
  };

  const alert = (options: DialogOptions): Promise<void> => {
    setOptions({ ...options, isAlert: true });
    setIsOpen(true);
    return new Promise((resolve) => {
      setResolveFn(() => () => resolve()); // Maps boolean resolve to void
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolveFn) resolveFn(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolveFn) resolveFn(false);
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={options?.title || (options?.isAlert ? 'Notice' : 'Confirm')}
      >
        <p className="text-gray-600 font-medium leading-relaxed">
          {options?.message}
        </p>
        <div className="mt-8 flex justify-end gap-3">
          {!options?.isAlert && (
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {options?.cancelText || 'Cancel'}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-[#b68c5b] hover:bg-[#a07a4f] shadow-md shadow-[#b68c5b]/20 transition-colors"
          >
            {options?.confirmText || 'OK'}
          </button>
        </div>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
