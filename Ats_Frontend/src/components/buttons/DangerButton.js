import React from 'react';

const DangerButton = ({ 
  children, 
  onClick, 
  type = 'button', 
  disabled = false, 
  icon = null,
  className = '' 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg 
        flex items-center justify-center transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default DangerButton;