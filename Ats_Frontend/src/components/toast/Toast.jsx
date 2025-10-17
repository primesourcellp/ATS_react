import React, { useEffect } from "react";
import { FaCheckCircle, FaExclamationCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from "react-icons/fa";

const Toast = ({ title, message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: FaCheckCircle,
    error: FaExclamationCircle,
    warning: FaExclamationTriangle,
    info: FaInfoCircle
  };

  const Icon = icons[type];
  const bgColor = {
    success: "bg-green-100 border-green-200",
    error: "bg-red-100 border-red-200",
    warning: "bg-yellow-100 border-yellow-200",
    info: "bg-blue-100 border-blue-200"
  };

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    warning: "text-yellow-800",
    info: "text-blue-800"
  };

  const iconColor = {
    success: "text-green-500",
    error: "text-red-500",
    warning: "text-yellow-500",
    info: "text-blue-500"
  };

  return (
    <div className={`flex items-center w-full max-w-xs p-4 border rounded-lg shadow-lg ${bgColor[type]} animate-fadeIn`}>
      <Icon className={`text-xl ${iconColor[type]} mr-3`} />
      <div className="flex-1">
        <h4 className={`font-medium ${textColor[type]}`}>{title}</h4>
        <p className={`text-sm ${textColor[type]}`}>{message}</p>
      </div>
      <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
        <FaTimes />
      </button>
    </div>
  );
};

export default Toast;