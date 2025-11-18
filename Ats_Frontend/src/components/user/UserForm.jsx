import { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../../api/api';

const normalizeRole = (role) => (role || '').replace('ROLE_', '');

const UserForm = ({ user, onSave, onClose, currentUserRole = '' }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // ✅ New state
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('RECRUITER');
  const [errors, setErrors] = useState({});
  const [validating, setValidating] = useState({ username: false, email: false });
  const [validationResults, setValidationResults] = useState({ username: null, email: null });

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || ''); // ✅ Prefill email if editing
      setPassword('');
      setRole(normalizeRole(user.role) || 'RECRUITER');
    } else {
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('RECRUITER');
    }
    setErrors({});
    setValidationResults({ username: null, email: null });
  }, [user]);

  // Debounced validation functions
  const debounce = useCallback((func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  const validateUsername = useCallback(
    debounce(async (usernameValue) => {
      if (!usernameValue || usernameValue.trim() === '') {
        setValidationResults(prev => ({ ...prev, username: null }));
        return;
      }

      // Skip validation if editing the same user
      if (user && user.username === usernameValue) {
        setValidationResults(prev => ({ ...prev, username: null }));
        return;
      }

      setValidating(prev => ({ ...prev, username: true }));
      try {
        const result = await userAPI.checkUsernameExists(usernameValue);
        setValidationResults(prev => ({ ...prev, username: result.exists }));
      } catch (error) {
        console.error('Error validating username:', error);
        setValidationResults(prev => ({ ...prev, username: null }));
      } finally {
        setValidating(prev => ({ ...prev, username: false }));
      }
    }, 500),
    [user, debounce]
  );

  const validateEmail = useCallback(
    debounce(async (emailValue) => {
      if (!emailValue || emailValue.trim() === '') {
        setValidationResults(prev => ({ ...prev, email: null }));
        return;
      }

      // Skip validation if editing the same user
      if (user && user.email === emailValue) {
        setValidationResults(prev => ({ ...prev, email: null }));
        return;
      }

      setValidating(prev => ({ ...prev, email: true }));
      try {
        const result = await userAPI.checkEmailExists(emailValue);
        setValidationResults(prev => ({ ...prev, email: result.exists }));
      } catch (error) {
        console.error('Error validating email:', error);
        setValidationResults(prev => ({ ...prev, email: null }));
      } finally {
        setValidating(prev => ({ ...prev, email: false }));
      }
    }, 500),
    [user, debounce]
  );

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) newErrors.username = 'Username is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Invalid email format';
    if (!user && !password.trim()) newErrors.password = 'Password is required';
    
    // Check real-time validation results
    if (validationResults.username === true) {
      newErrors.username = 'Username already exists';
    }
    if (validationResults.email === true) {
      newErrors.email = 'Email already exists';
    }
    
    // Additional validation for admin users
    if (role === 'ADMIN' && user && normalizeRole(user.role) !== 'ADMIN') {
      newErrors.role = 'Only one admin user is allowed. Cannot change existing user to admin.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const actingRole = normalizeRole(currentUserRole);
    const isEditingSameRestrictedRole = user && normalizeRole(user.role) === role;
    if (
      actingRole !== 'ADMIN' &&
      (role === 'ADMIN' || role === 'SECONDARY_ADMIN') &&
      !isEditingSameRestrictedRole
    ) {
      setErrors(prev => ({ ...prev, role: 'Only the primary admin can assign admin roles.' }));
      return;
    }
    setErrors(prev => {
      const { role: _omit, ...rest } = prev;
      return rest;
    });
    if (!validateForm()) return;

    const userData = { username, email, password, role }; // ✅ Added email
    onSave(userData);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {user ? 'Edit User' : 'Add New User'}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username *
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  validateUsername(e.target.value);
                }}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.username ? 'border-red-500' : 
                  validationResults.username === true ? 'border-red-500' :
                  validationResults.username === false ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="Enter username"
              />
              {validating.username && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
              {validationResults.username === true && !validating.username && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {validationResults.username === false && !validating.username && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? 'border-red-500' : 
                  validationResults.email === true ? 'border-red-500' :
                  validationResults.email === false ? 'border-green-500' : 'border-gray-300'
                }`}
                placeholder="Enter email"
              />
              {validating.email && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
              {validationResults.email === true && !validating.email && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              {validationResults.email === false && !validating.email && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {!user && '*'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password}</p>
            )}
            {user && (
              <p className="text-gray-500 text-xs mt-1">
                Leave blank to keep current password
              </p>
            )}
          </div>

          {/* Role */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.role ? 'border-red-500' : 'border-gray-300'
              }`}
            >
            <option value="ADMIN" disabled={normalizeRole(currentUserRole) !== 'ADMIN'}>
              ADMIN
            </option>
            <option value="SECONDARY_ADMIN" disabled={normalizeRole(currentUserRole) !== 'ADMIN'}>
              SECONDARY_ADMIN
            </option>
              <option value="RECRUITER">RECRUITER</option>
              <option value="SUB_USER">USER</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role}</p>
            )}
          {normalizeRole(currentUserRole) === 'SECONDARY_ADMIN' && (
            <p className="text-xs text-gray-500 mt-1">
              Secondary admins can create recruiters and users. Contact the primary admin for admin role changes.
            </p>
          )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              {user ? 'Update User' : 'Add User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
