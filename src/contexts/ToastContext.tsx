import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info';

interface ToastOptions {
  message: string;
  type?: ToastType;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastOptions | null>(null);

  const showToast = (options: ToastOptions) => {
    setToast(options);
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const error = (message: string) => showToast({ message, type: 'error' });
  const success = (message: string) => showToast({ message, type: 'success' });

  return (
    <ToastContext.Provider value={{ showToast, error, success }}>
      {children}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#121212] text-white p-4 font-sans text-xs flex items-center gap-4 max-w-sm border border-white/20 shadow-2xl relative overflow-hidden">
             {/* Decorative element */}
             <div className={`absolute top-0 left-0 w-1 h-full ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'success' ? 'bg-emerald-500' : 'bg-white'}`}></div>
             
             <div className="flex-shrink-0 ml-1">
               {toast.type === 'error' ? <AlertCircle size={16} className="text-red-400" /> : 
                toast.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-400" /> : 
                <AlertCircle size={16} className="text-white/50" />}
             </div>
             
             <div className="flex-1 font-bold tracking-wide leading-relaxed">
               {toast.message}
             </div>
             
             <button onClick={() => setToast(null)} className="flex-shrink-0 text-white/50 hover:text-white transition-colors cursor-pointer">
               <X size={14} />
             </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
