import React from 'react';
import PrimaryButton from './PrimaryButton';

const ToggleFormButton = ({ isFormVisible, onClick, className = '' }) => {
  return (
    <PrimaryButton
      onClick={onClick}
      className={className}
      icon={isFormVisible ? <i className="fas fa-minus"></i> : <i className="fas fa-plus"></i>}
    >
      {isFormVisible ? 'Close Form' : 'New Job'}
    </PrimaryButton>
  );
};

export default ToggleFormButton;