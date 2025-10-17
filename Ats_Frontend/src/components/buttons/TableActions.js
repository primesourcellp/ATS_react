import React from 'react';
import IconButton from './IconButton';

const TableActions = ({ 
  onEdit, 
  onDelete, 
  onView, 
  viewTitle = 'View',
  editTitle = 'Edit',
  deleteTitle = 'Delete'
}) => {
  return (
    <div className="flex space-x-2">
      {onView && (
        <IconButton
          icon="fas fa-eye"
          onClick={onView}
          title={viewTitle}
          variant="primary"
          size="sm"
        />
      )}
      {onEdit && (
        <IconButton
          icon="fas fa-edit"
          onClick={onEdit}
          title={editTitle}
          variant="warning"
          size="sm"
        />
      )}
      {onDelete && (
        <IconButton
          icon="fas fa-trash"
          onClick={onDelete}
          title={deleteTitle}
          variant="danger"
          size="sm"
        />
      )}
    </div>
  );
};

export default TableActions;