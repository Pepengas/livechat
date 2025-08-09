import React, { useState, useRef } from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function RegisterForm({
  nameValue,
  emailValue,
  passwordValue,
  confirmPasswordValue,
  isPasswordVisible,
  isConfirmPasswordVisible,
  setNameValue,
  setEmailValue,
  setPasswordValue,
  setConfirmPasswordValue,
  setIsPasswordVisible,
  setIsConfirmPasswordVisible,
  setIsNameFocused,
  setIsEmailFocused,
  setIsPasswordFocused,
  setIsConfirmPasswordFocused,
}) {
  const emailInputRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleEmailFocus = () => {
    setIsEmailFocused(true);
    setTimeout(() => {
      if (emailInputRef.current) {
        emailInputRef.current.selectionStart = emailInputRef.current.value.length;
      }
    }, 0);
  };

  const togglePasswordVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameValue || !emailValue || !passwordValue || !confirmPasswordValue) {
      setErrorMessage('Please fill in all fields');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (passwordValue !== confirmPasswordValue) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (passwordValue.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    try {
      await register({
        name: nameValue,
        email: emailValue,
        password: passwordValue,
      });
      setErrorMessage('');
      navigate('/');
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <form className="w-full space-y-6" onSubmit={handleSubmit}>
      {errorMessage && (
        <div className="p-3 text-sm text-white bg-red-500 rounded-lg">{errorMessage}</div>
      )}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium text-white">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onFocus={() => setIsNameFocused(true)}
          onBlur={() => setIsNameFocused(false)}
          className="w-full px-4 py-3 text-gray-800 transition-all duration-200 bg-white border-0 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="Your name"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-white">
          Email
        </label>
        <input
          id="email"
          ref={emailInputRef}
          type="text"
          pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
          value={emailValue}
          onChange={(e) => setEmailValue(e.target.value)}
          onFocus={handleEmailFocus}
          onBlur={() => setIsEmailFocused(false)}
          className="w-full px-4 py-3 text-gray-800 transition-all duration-200 bg-white border-0 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="hello@example.com"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-white">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            type={isPasswordVisible ? 'text' : 'password'}
            value={passwordValue}
            onChange={(e) => setPasswordValue(e.target.value)}
            onFocus={() => setIsPasswordFocused(true)}
            onBlur={() => setIsPasswordFocused(false)}
            className="w-full px-4 py-3 text-gray-800 transition-all duration-200 bg-white border-0 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="••••••••"
          />
          <button
            type="button"
            onMouseDown={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {isPasswordVisible ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
          Confirm Password
        </label>
        <div className="relative">
          <input
            id="confirmPassword"
            type={isConfirmPasswordVisible ? 'text' : 'password'}
            value={confirmPasswordValue}
            onChange={(e) => setConfirmPasswordValue(e.target.value)}
            onFocus={() => setIsConfirmPasswordFocused(true)}
            onBlur={() => setIsConfirmPasswordFocused(false)}
            className="w-full px-4 py-3 text-gray-800 transition-all duration-200 bg-white border-0 rounded-lg shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
            placeholder="••••••••"
          />
          <button
            type="button"
            onMouseDown={toggleConfirmPasswordVisibility}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {isConfirmPasswordVisible ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      <button
        type="submit"
        className="w-full py-3 mt-8 text-white transition-all duration-200 transform bg-green-600 rounded-lg shadow-lg hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98]"
      >
        Register
      </button>
      <button
        type="button"
        onClick={handleLogin}
        className="w-full py-3 text-white transition-all duration-200 transform bg-blue-600 rounded-lg shadow-lg hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98]"
      >
        Back to Login
      </button>
    </form>
  );
}

export default RegisterForm;

