import React, { useState, useEffect, createContext, useContext, type ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000); // Toast visible por 5 segundos

    const removeTimer = setTimeout(() => {
      onRemove();
    }, 5500); // Eliminar del DOM después de la animación de salida

    return () => {
      clearTimeout(timer);
      clearTimeout(removeTimer);
    };
  }, [onRemove]);

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success': 
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(16, 185, 129, 0.5)',
          color: '#10b981'
        };
      case 'error': 
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(239, 68, 68, 0.5)',
          color: '#f87171'
        };
      case 'info': 
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          color: '#60a5fa'
        };
      case 'warning': 
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          color: '#fbbf24'
        };
      default: 
        return {
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(59, 130, 246, 0.5)',
          color: '#60a5fa'
        };
    }
  };

  const toastStyles = getToastStyles(toast.type);

  return (
    <div style={{
      backgroundColor: toastStyles.backgroundColor,
      border: toastStyles.border,
      backdropFilter: 'blur(16px)',
      color: toastStyles.color,
      padding: '0.75rem 1.25rem',
      borderRadius: '0.75rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
      minWidth: '200px',
      maxWidth: '300px',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
      transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, border-color 0.3s ease, box-shadow 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      fontWeight: '500',
      fontSize: '0.875rem',
    }}>
      <span>{toast.message}</span>
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: toastStyles.color,
          cursor: 'pointer',
          fontSize: '1.25rem',
          lineHeight: 1,
          padding: '0.25rem',
          borderRadius: '0.25rem',
          transition: 'background-color 0.2s ease',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        &times;
      </button>
    </div>
  );
};
