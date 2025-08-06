import React, { useEffect, useState } from 'react';
import { LoginForm } from './LoginForm';
import { CartoonBear } from './CartoonBear';
export function LoginScreen() {
  const [emailValue, setEmailValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [bearMood, setBearMood] = useState<'neutral' | 'happy' | 'angry'>('neutral');
  // Track cursor position in email field
  useEffect(() => {
    if (isEmailFocused) {
      const emailInput = document.getElementById('email') as HTMLInputElement;
      if (emailInput) {
        setCursorPosition(emailInput.selectionStart || emailValue.length);
      } else {
        setCursorPosition(emailValue.length);
      }
    }
  }, [emailValue, isEmailFocused]);
  // Handle login result
  useEffect(() => {
    if (loginSuccess) {
      setBearMood('happy');
    } else if (loginAttempts >= 3) {
      setBearMood('angry');
    } else {
      setBearMood('neutral');
    }
  }, [loginAttempts, loginSuccess]);
  // Calculate eye position based on cursor position in email input
  const calculateEyePosition = () => {
    if (!isEmailFocused) return {
      x: 0,
      y: 0
    };
    // No input yet, eyes centered
    if (emailValue.length === 0) return {
      x: 0,
      y: 3
    };
    // Calculate horizontal position based on cursor position
    const maxHorizontalMove = 12;
    const horizontalPosition = Math.min(cursorPosition, 30) / 30;
    const x = horizontalPosition * maxHorizontalMove - maxHorizontalMove / 2;
    // Look down slightly when typing
    const y = 3;
    return {
      x,
      y
    };
  };
  const handleLoginAttempt = (success: boolean) => {
    if (success) {
      setLoginSuccess(true);
    } else {
      setLoginAttempts(prev => prev + 1);
    }
  };
  return <div className="flex flex-col items-center justify-start w-full min-h-screen px-6 py-12 bg-navy-800">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8">
          <CartoonBear eyePosition={calculateEyePosition()} coverEyes={isPasswordFocused && passwordValue.length > 0} peekingEyes={isPasswordVisible && isPasswordFocused && passwordValue.length > 0} mood={bearMood} />
        </div>
        <h1 className="mb-8 text-3xl font-bold text-center text-white">
          Welcome Back!
        </h1>
        <LoginForm emailValue={emailValue} passwordValue={passwordValue} isPasswordVisible={isPasswordVisible} setEmailValue={setEmailValue} setPasswordValue={setPasswordValue} setIsPasswordVisible={setIsPasswordVisible} setIsEmailFocused={setIsEmailFocused} setIsPasswordFocused={setIsPasswordFocused} onLoginAttempt={handleLoginAttempt} />
      </div>
    </div>;
}