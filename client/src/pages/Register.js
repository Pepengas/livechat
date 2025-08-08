import React, { useEffect, useState } from 'react';
import { RegisterForm } from '../components/bear/RegisterForm';
import { CartoonBear } from '../components/bear/CartoonBear';

const Register = () => {
  const [nameValue, setNameValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmPasswordValue, setConfirmPasswordValue] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    let inputEl = null;
    let value = '';
    if (isNameFocused) {
      inputEl = document.getElementById('name');
      value = nameValue;
    } else if (isEmailFocused) {
      inputEl = document.getElementById('email');
      value = emailValue;
    } else {
      return;
    }
    
    if (inputEl) {
      setCursorPosition(inputEl.selectionStart || value.length);
    } else {
      setCursorPosition(value.length);
    }
    
   
  }, [nameValue, emailValue, isNameFocused, isEmailFocused]);

  const calculateEyePosition = () => {
    const isFieldFocused = isNameFocused || isEmailFocused;
    const value = isNameFocused ? nameValue : emailValue;
    if (!isFieldFocused) {
      return { x: 0, y: 0 };
    }
    if (value.length === 0) {
      return { x: 0, y: 3 };
    }
    const maxHorizontalMove = 12;
    const horizontalPosition = Math.min(cursorPosition, 30) / 30;
    const x = horizontalPosition * maxHorizontalMove - maxHorizontalMove / 2;
    const y = 3;
    return { x, y };
  };

  return (
    <div className="flex flex-col items-center justify-start w-full min-h-screen px-6 py-12 bg-navy-800">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8">
          <CartoonBear
            eyePosition={calculateEyePosition()}
            coverEyes={
              (isPasswordFocused && passwordValue.length > 0) ||
              (isConfirmPasswordFocused && confirmPasswordValue.length > 0)
            }
            peekingEyes={
              (isPasswordVisible && isPasswordFocused && passwordValue.length > 0) ||
              (isConfirmPasswordVisible &&
                isConfirmPasswordFocused &&
                confirmPasswordValue.length > 0)
            }
            mood="neutral"
          />
        </div>
        <h1 className="mb-8 text-3xl font-bold text-center text-white">Create Account</h1>
        <RegisterForm
          nameValue={nameValue}
          emailValue={emailValue}
          passwordValue={passwordValue}
          confirmPasswordValue={confirmPasswordValue}
          isPasswordVisible={isPasswordVisible}
          isConfirmPasswordVisible={isConfirmPasswordVisible}
          setNameValue={setNameValue}
          setEmailValue={setEmailValue}
          setPasswordValue={setPasswordValue}
          setConfirmPasswordValue={setConfirmPasswordValue}
          setIsPasswordVisible={setIsPasswordVisible}
          setIsConfirmPasswordVisible={setIsConfirmPasswordVisible}
          setIsNameFocused={setIsNameFocused}
          setIsEmailFocused={setIsEmailFocused}
          setIsPasswordFocused={setIsPasswordFocused}
          setIsConfirmPasswordFocused={setIsConfirmPasswordFocused}
        />
      </div>
    </div>
  );
};

export default Register;

