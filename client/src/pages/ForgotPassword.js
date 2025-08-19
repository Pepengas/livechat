import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/authService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !newPassword) {
      setErrorMessage('Please fill in all fields');
      setSuccessMessage('');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      setSuccessMessage('');
      return;
    }
    try {
      await resetPassword(email, newPassword);
      setErrorMessage('');
      setSuccessMessage('Password reset successfully');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setSuccessMessage('');
try {
      await resetPassword(email, newPassword);
      setErrorMessage('');
      setSuccessMessage('Password reset successfully');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setSuccessMessage('');
      setErrorMessage(
        err.response?.data?.message || err.message || 'Password reset failed'
      );
    }
  };
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen px-6 py-12 bg-navy-800">
      <div className="w-full max-w-md mx-auto">
        <h1 className="mb-8 text-3xl font-bold text-center text-white">Reset Password</h1>
        {errorMessage && (
          <div className="p-3 mb-4 text-sm text-white bg-red-500 rounded-lg">{errorMessage}</div>
        )}
        {successMessage && (
          <div className="p-3 mb-4 text-sm text-white bg-green-500 rounded-lg">{successMessage}</div>
        )}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-gray-800 transition-all duration-200 bg-white border-0 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="hello@example.com"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="newPassword" className="block text-sm font-medium text-white">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 text-gray-800 transition-all duration-200 bg-white border-0 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 text-white transition-all duration-200 transform bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]"
          >
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
