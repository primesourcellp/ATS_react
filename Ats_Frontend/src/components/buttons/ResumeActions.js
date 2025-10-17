import React from 'react';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';

const ResumeActions = ({ 
  onView, 
  onDownload, 
  hasResume = false,
  viewLabel = 'View Resume',
  downloadLabel = 'Download Resume'
}) => {
  return (
    <div className="flex space-x-3">
      <PrimaryButton
        onClick={onView}
        disabled={!hasResume}
        icon={<i className="fas fa-eye"></i>}
        className="text-sm py-1 px-3"
      >
        {viewLabel}
      </PrimaryButton>
      <SecondaryButton
        onClick={onDownload}
        disabled={!hasResume}
        icon={<i className="fas fa-download"></i>}
        className="text-sm py-1 px-3"
      >
        {downloadLabel}
      </SecondaryButton>
    </div>
  );
};

export default ResumeActions;