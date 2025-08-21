import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const ToastContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
  
  @media (max-width: 640px) {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
`;

const ToastItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 0.75rem;
  backdrop-filter: blur(20px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  animation: ${props => props.$isExiting ? slideOut : slideIn} 0.3s ease-out;
  border: 1px solid;
  
  ${props => {
    switch (props.$variant) {
      case 'success':
        return `
          background: rgba(34, 197, 94, 0.95);
          border-color: rgba(34, 197, 94, 0.2);
          color: white;
        `;
      case 'error':
        return `
          background: rgba(239, 68, 68, 0.95);
          border-color: rgba(239, 68, 68, 0.2);
          color: white;
        `;
      case 'warning':
        return `
          background: rgba(245, 158, 11, 0.95);
          border-color: rgba(245, 158, 11, 0.2);
          color: white;
        `;
      default:
        return `
          background: rgba(59, 130, 246, 0.95);
          border-color: rgba(59, 130, 246, 0.2);
          color: white;
        `;
    }
  }}
`;

const ToastIcon = styled.div`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 0.125rem;
`;

const ToastContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ToastTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: 0.25rem;
`;

const ToastDescription = styled.div`
  font-size: 0.75rem;
  opacity: 0.9;
  line-height: 1.4;
`;

const ToastActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ToastButton = styled.button`
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const CloseButton = styled.button`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
  }
`;

const ProgressBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 0 0 0.75rem 0.75rem;
  transition: width 0.1s linear;
  width: ${props => props.$progress}%;
`;

const getIcon = (variant) => {
  switch (variant) {
    case 'success':
      return <CheckCircle size={20} />;
    case 'error':
      return <XCircle size={20} />;
    case 'warning':
      return <AlertCircle size={20} />;
    default:
      return <Info size={20} />;
  }
};

export const Toast = ({ 
  id,
  title, 
  description, 
  variant = 'info',
  duration = 5000,
  actions = [],
  onClose,
  persistent = false
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!persistent && duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          if (newProgress <= 0) {
            handleClose();
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [duration, persistent]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  return (
    <ToastItem $variant={variant} $isExiting={isExiting}>
      <ToastIcon>
        {getIcon(variant)}
      </ToastIcon>
      
      <ToastContent>
        {title && <ToastTitle>{title}</ToastTitle>}
        {description && <ToastDescription>{description}</ToastDescription>}
        
        {actions.length > 0 && (
          <ToastActions>
            {actions.map((action, index) => (
              <ToastButton
                key={index}
                onClick={action.onClick}
              >
                {action.label}
              </ToastButton>
            ))}
          </ToastActions>
        )}
      </ToastContent>
      
      <CloseButton onClick={handleClose}>
        <X size={16} />
      </CloseButton>
      
      {!persistent && duration > 0 && (
        <ProgressBar $progress={progress} />
      )}
    </ToastItem>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  // Provide toast functions through context or global
  useEffect(() => {
    window.toast = {
      success: (title, description, options = {}) => 
        addToast({ title, description, variant: 'success', ...options }),
      error: (title, description, options = {}) => 
        addToast({ title, description, variant: 'error', ...options }),
      warning: (title, description, options = {}) => 
        addToast({ title, description, variant: 'warning', ...options }),
      info: (title, description, options = {}) => 
        addToast({ title, description, variant: 'info', ...options }),
      clearAll
    };
  }, []);

  return (
    <>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </ToastContainer>
    </>
  );
};

export default Toast;
