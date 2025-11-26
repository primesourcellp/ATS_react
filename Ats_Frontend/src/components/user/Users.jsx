import { useState, useEffect } from 'react';
import Navbar from '../../layout/navbar';
import Toast from '../toast/Toast';
import UserTable from './UserTable';
import UserForm from './UserForm';
import { userAPI } from '../../api/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userIdSearch, setUserIdSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    secondaryAdmins: 0,
    recruiters: 0,
    users: 0
  });
  const [userPendingDeletion, setUserPendingDeletion] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const normalizeRole = (role) => (role || '').replace('ROLE_', '');

  useEffect(() => {
    const role = localStorage.getItem("role")?.replace("ROLE_", "") || "";
    setUserRole(role);
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    calculateStats();
  }, [users, searchTerm, userIdSearch, statusFilter, roleFilter, sortBy]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.getAll();
      setUsers(data || []);
    } catch (error) {
      showToast('Error', error.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];

    // Filter by user ID (dedicated search - exact match)
    if (userIdSearch) {
      const idToSearch = userIdSearch.trim();
      result = result.filter(user => {
        if (user.id) {
          return user.id.toString() === idToSearch;
        }
        return false;
      });
    }

    // Filter by search term (general search - excludes ID)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user => 
        (user.username && user.username.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (normalizeRole(user.role).toLowerCase().includes(term))
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter(user => normalizeRole(user.role) === roleFilter);
    }

    // Sort users
    switch(sortBy) {
      case 'newest':
        // Assuming users have a createdAt field
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'name':
        result.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
        break;
      default:
        break;
    }

    setFilteredUsers(result);
  };

  const calculateStats = () => {
    const total = users.length;
    const admins = users.filter(user => normalizeRole(user.role) === 'ADMIN').length;
    const secondaryAdmins = users.filter(user => normalizeRole(user.role) === 'SECONDARY_ADMIN').length;
    const recruiters = users.filter(user => normalizeRole(user.role) === 'RECRUITER').length;
    const subUsers = users.filter(user => normalizeRole(user.role) === 'SUB_USER').length;
    
    setStats({ total, admins, secondaryAdmins, recruiters, users: subUsers });
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const requestDeleteUser = (user) => {
    setUserPendingDeletion(user);
  };

  const cancelDeleteUser = () => {
    setUserPendingDeletion(null);
    setDeleting(false);
  };

  const confirmDeleteUser = async () => {
    if (!userPendingDeletion || deleting) {
      return;
    }
    
    // Check if trying to delete the only admin user
    const userRole = normalizeRole(userPendingDeletion.role);
    if (userRole === 'ADMIN') {
      const adminCount = users.filter(user => normalizeRole(user.role) === 'ADMIN').length;
      if (adminCount === 1) {
        showToast('Error', 'Cannot delete the only admin user. Please create another admin user first, or promote a secondary admin to admin before deleting this user.', 'error');
        setUserPendingDeletion(null);
        return;
      }
    }
    
    try {
      setDeleting(true);
      await userAPI.delete(userPendingDeletion.id);
      showToast('Success', 'User deleted successfully', 'success');
      setUserPendingDeletion(null);
      loadUsers();
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete user';
      // Check if error is about deleting the only admin
      if (errorMessage.toLowerCase().includes('admin') || errorMessage.toLowerCase().includes('last admin')) {
        showToast('Error', 'Cannot delete the only admin user. Please create another admin user first.', 'error');
      } else {
        showToast('Error', errorMessage, 'error');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (selectedUser) {
        // For admin users, ensure we don't send empty password
        if (selectedUser.role === 'ADMIN' && (!userData.password || userData.password.trim() === '')) {
          delete userData.password; // Remove empty password from update
        }
        
        await userAPI.update(selectedUser.id, userData);
        showToast('Success', 'User updated successfully', 'success');
      } else {
        // Prevent creating ADMIN users through UI
        if (userData.role === 'ADMIN') {
          throw new Error('Admin users cannot be created through the user management interface. Please contact the system administrator.');
        }
        
        // Determine which endpoint to use based on role
        switch (userData.role) {
          case 'SECONDARY_ADMIN':
            await userAPI.createSecondaryAdmin(userData);
            break;
          case 'RECRUITER':
            await userAPI.createRecruiter(userData);
            break;
          case 'SUB_USER':
            await userAPI.createUser(userData);
            break;
          default:
            throw new Error('Invalid role selected');
        }
        showToast('Success', `${userData.role} created successfully`, 'success');
      }
      setShowUserForm(false);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      const errorMessage = error.message || error.response?.data || 'Failed to save user';
      showToast('Error', errorMessage, 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await userAPI.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      window.location.href = "/login";
    }
  };

  const showToast = (title, message, type = 'success') => {
    const id = Date.now();
    const newToast = { id, title, message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const exportUsers = () => {
    // Simple CSV export implementation
    const headers = ['ID', 'Username', 'Email', 'Role', 'Status', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(user => [
        user.id,
        `"${user.username}"`,
        `"${user.email}"`,
        normalizeRole(user.role),
        user.status || 'Active',
        user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'users_export.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar-style Navbar */}
      <Navbar onLogout={handleLogout} />

      {/* Main content */}
      <main className="flex-1 p-6">
        {/* Header */}
        <div className="py-10">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage system users and permissions</p>
            </div>
          </div>
        </div>

        {/* Simple Stats Overview */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-1">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Total Users:</span>
                <span className="text-lg font-semibold text-gray-900">{stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Admins:</span>
                <span className="text-lg font-semibold text-purple-600">{stats.admins}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Recruiters:</span>
                <span className="text-lg font-semibold text-green-600">{stats.recruiters}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Users:</span>
                <span className="text-lg font-semibold text-orange-600">{stats.users}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time ATS Search Bar */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl shadow-md p-4 mb-6 border border-purple-100">
          <div className="flex flex-col lg:flex-row gap-3 items-end">
            {/* General Search - Large and Prominent */}
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search users by username, email, or role..."
                  className="w-full pl-12 pr-12 py-3.5 text-base border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-purple-50 rounded-r-lg transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* ID Search - Compact */}
            <div className="w-full lg:w-48">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="User ID..."
                  className="w-full pl-10 pr-10 py-3.5 text-base border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all duration-200"
                  value={userIdSearch}
                  onChange={(e) => setUserIdSearch(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      filterUsers();
                    }
                  }}
                />
                {userIdSearch && (
                  <button
                    onClick={() => {
                      setUserIdSearch('');
                      filterUsers();
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors"
                    title="Clear ID search"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Clear Button - Only show when search is active */}
            {(searchTerm || userIdSearch) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setUserIdSearch('');
                  loadUsers();
                }}
                className="px-4 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium whitespace-nowrap shadow-sm"
              >
                Clear All
              </button>
            )}
          </div>
          
          {/* Real-time Results Count */}
          {(searchTerm || userIdSearch) && (
            <div className="mt-3 flex items-center text-sm text-purple-700">
              <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found</span>
              {(searchTerm || userIdSearch) && (
                <span className="ml-2 text-purple-600">
                  {searchTerm && `• "${searchTerm}"`}
                  {userIdSearch && ` • ID: ${userIdSearch}`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Quick Filters - Compact ATS Style */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white min-w-[160px]"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="SECONDARY_ADMIN">Secondary Admin</option>
                <option value="RECRUITER">Recruiter</option>
                <option value="SUB_USER">User</option>
              </select>
              {roleFilter !== 'all' && (
                <button
                  onClick={() => setRoleFilter('all')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              )}
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
              </svg>
              <select
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">By Name</option>
              </select>
            </div>

            {/* Clear All Filters */}
            {(roleFilter !== 'all') && (
              <button
                onClick={() => {
                  setRoleFilter('all');
                }}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Clear Filters
              </button>
            )}

            {/* Export CSV Button */}
            <button
              onClick={exportUsers}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>

            {/* Add User Button */}
            <button
              onClick={handleAddUser}
              className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center gap-2 transition-colors font-medium shadow-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <UserTable
            users={filteredUsers}
            loading={loading}
            onEditUser={handleEditUser}
            onDeleteUser={requestDeleteUser}
            searchTerm={searchTerm}
            allUsers={users}
          />
        </div>

        {/* User Form Modal */}
        {showUserForm && (
          <UserForm
            user={selectedUser}
            onSave={handleSaveUser}
            onClose={() => {
              setShowUserForm(false);
              setSelectedUser(null);
            }}
            currentUserRole={userRole}
          />
        )}

        {/* Toasts */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(toast => (
            <Toast
              key={toast.id}
              title={toast.title}
              message={toast.message}
              type={toast.type}
              onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            />
          ))}
        </div>
      </main>

      {userPendingDeletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
              <button
                onClick={cancelDeleteUser}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900">{userPendingDeletion.username}</span>
              ? This will keep their history on candidates, applications, and interviews, but they will no longer be able to sign in.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDeleteUser}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;