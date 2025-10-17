// ToastContext.jsx
import React, { createContext, useContext, useRef } from "react";
import ToastManager from "./ToastManager";

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const toastRef = useRef(null);

  const showToast = (title, message, type = "success") => {
    if (toastRef.current) {
      toastRef.current(title, message, type);
    }
  };

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <ToastManager ref={toastRef} />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
