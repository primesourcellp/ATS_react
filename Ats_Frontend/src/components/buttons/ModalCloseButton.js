import React from 'react';
import IconButton from './IconButton';

const ModalCloseButton = ({ onClose, className = '' }) => {
  return (
    <IconButton
      icon="fas fa-times"
      onClick={onClose}
      title="Close"
      size="md"
      variant="default"
      className={className}
    />
  );
};

export default ModalCloseButton;