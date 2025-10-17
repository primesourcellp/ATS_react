import React from 'react';

const IconButton = ({ 
  icon, 
  onClick, 
  type = 'button', 
  disabled = false, 
  title = '',
  size = 'md',
  variant = 'default' 
}) => {
  const sizeClasses = {
    sm: 'p-1 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg'
  };

  const variantClasses = {
    default: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
    primary: 'text-blue-600 hover:text-blue-800 hover:bg-blue-100',
    warning: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100',
    danger: 'text-red-600 hover:text-red-800 hover:bg-red-100',
    success: 'text-green-600 hover:text-green-800 hover:bg-green-100'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        rounded-full transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
      `}
    >
      <i className={icon}></i>
    </button>
  );
};

export default IconButton;