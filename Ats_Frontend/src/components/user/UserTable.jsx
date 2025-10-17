import { useState } from 'react';

const UserTable = ({ users, loading, onEditUser, onDeleteUser, searchTerm }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [expandedUser, setExpandedUser] = useState(null);

  // Function to highlight search term in text
  const highlightSearchTerm = (text, term) => {
    if (!term || !text) return text;
    
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();
    
    // Exact match
    if (lowerText === lowerTerm) {
      return `<span class="bg-yellow-200 font-semibold px-1 rounded">${text}</span>`;
    }
    
    // Starts with match
    if (lowerText.startsWith(lowerTerm)) {
      const matchedPart = text.substr(0, term.length);
      const remainingPart = text.substr(term.length);
      return `<span class="bg-yellow-100 font-medium px-1 rounded">${matchedPart}</span>${remainingPart}`;
    }
    
    // Partial match
    const index = lowerText.indexOf(lowerTerm);
    if (index !== -1) {
      const before = text.substr(0, index);
      const matched = text.substr(index, term.length);
      const after = text.substr(index + term.length);
      return `${before}<span class="bg-yellow-50 px-1 rounded">${matched}</span>${after}`;
    }
    
    return text;
  };

  // Sorting function
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const sortedUsers = [...users];
  if (sortConfig.key) {
    sortedUsers.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }

  const toggleExpand = (userId) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(userId);
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'ADMIN': { color: 'bg-purple-100 text-purple-800', icon: '🔐' },
      'USER': { color: 'bg-blue-100 text-blue-800', icon: '👤' },
      'RECRUITER': { color: 'bg-green-100 text-green-800', icon: '👔' },
      'SUB_USER': { color: 'bg-orange-100 text-orange-800', icon: '👥' },
      'SUPER_ADMIN': { color: 'bg-red-100 text-red-800', icon: '⚡' }
    };
    
    const config = roleConfig[role.replace('ROLE_', '')] || { color: 'bg-gray-100 text-gray-800', icon: '❓' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {role.replace('ROLE_', '')}
      </span>
    );
  };

  // Separate admin users from others
  const adminUsers = sortedUsers.filter(user => user.role.includes('ADMIN'));
  const nonAdminUsers = sortedUsers.filter(user => !user.role.includes('ADMIN'));

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl shadow-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-sm">
        <div className="mx-auto w-24 h-24 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
        <p className="text-gray-500">Try adjusting your search or add a new user.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('id')}
              >
                <div className="flex items-center">
                  ID
                  {sortConfig.key === 'id' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('username')}
              >
                <div className="flex items-center">
                  Username
                  {sortConfig.key === 'username' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => requestSort('role')}
              >
                <div className="flex items-center">
                  Role
                  {sortConfig.key === 'role' && (
                    <span className="ml-1">
                      {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Admin Users Section with Special Styling */}
            {adminUsers.length > 0 && (
              <>
                <tr className="bg-blue-50">
                  <td colSpan="5" className="px-6 py-2">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-sm font-medium text-blue-800">Administrators ({adminUsers.length})</span>
                    </div>
                  </td>
                </tr>
                {adminUsers.map((user) => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    expandedUser={expandedUser}
                    toggleExpand={toggleExpand}
                    onEditUser={onEditUser}
                    onDeleteUser={onDeleteUser}
                    searchTerm={searchTerm}
                    highlightSearchTerm={highlightSearchTerm}
                    getRoleBadge={getRoleBadge}
                    isAdmin={true}
                  />
                ))}
              </>
            )}
            
            {/* Non-Admin Users Section */}
            {nonAdminUsers.length > 0 && (
              <>
                <tr className="bg-gray-50">
                  <td colSpan="5" className="px-6 py-2">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-gray-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="text-sm font-medium text-gray-800">Users ({nonAdminUsers.length})</span>
                    </div>
                  </td>
                </tr>
                {nonAdminUsers.map((user) => (
                  <UserRow 
                    key={user.id} 
                    user={user} 
                    expandedUser={expandedUser}
                    toggleExpand={toggleExpand}
                    onEditUser={onEditUser}
                    onDeleteUser={onDeleteUser}
                    searchTerm={searchTerm}
                    highlightSearchTerm={highlightSearchTerm}
                    getRoleBadge={getRoleBadge}
                    isAdmin={false}
                  />
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Separate component for user row to reduce duplication
const UserRow = ({ user, expandedUser, toggleExpand, onEditUser, onDeleteUser, searchTerm, highlightSearchTerm, getRoleBadge, isAdmin }) => (
  <>
    <tr 
      key={user.id} 
      className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${isAdmin ? 'bg-blue-25' : ''}`}
      onClick={() => toggleExpand(user.id)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">#{user.id}</div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${isAdmin ? 'bg-purple-100' : 'bg-blue-100'}`}>
            <span className={`font-medium ${isAdmin ? 'text-purple-700' : 'text-blue-700'}`}>
              {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              <span dangerouslySetInnerHTML={{ 
                __html: highlightSearchTerm(user.username, searchTerm) 
              }} />
            </div>
            <div className="text-sm text-gray-500">
              {user.email || 'No email provided'}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {getRoleBadge(user.role)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
          Active
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditUser(user);
            }}
            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-50 transition-colors"
            title="Edit User"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteUser(user.id);
            }}
            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
            title="Delete User"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
    {expandedUser === user.id && (
      <tr className={isAdmin ? "bg-purple-25" : "bg-blue-50"}>
        <td colSpan="5" className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">User Details</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">ID:</span> {user.id}</p>
                <p><span className="font-medium">Username:</span> {user.username}</p>
                <p><span className="font-medium">Email:</span> {user.email || 'No email provided'}</p>
                <p><span className="font-medium">Role:</span> {user.role}</p>
                {isAdmin && (
                  <p className="text-purple-600 font-medium">⭐ Administrator Account</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">User Actions</h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEditUser(user)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit User
                </button>
                <button
                  onClick={() => onDeleteUser(user.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </td>
      </tr>
    )}
  </>
);

export default UserTable;