import React, { useState, useEffect } from 'react';
import { useRive, Layout } from 'rive-react';

// Load the teddy.riv asset from public/assets
const RIVE_SRC = '/assets/teddy.riv';
const STATE_MACHINE = 'Login Machine';
const MULTIPLIER = 10;

export default function LoginFormComponent() {
  // 1. Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  // 2. Initialize Rive
  const { rive, RiveComponent } = useRive({
    src: RIVE_SRC,
    stateMachines: STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: 'contain', alignment: { x: 0.5, y: 0.5 } }),
  });

  // 3. Cache state machine inputs
  const numLookInput = rive?.stateMachineInputs.find(i => i.name === 'numLook')!;
  const isCheckingInput = rive?.stateMachineInputs.find(i => i.name === 'isChecking')!;
  const trigSuccess = rive?.stateMachineInputs.find(i => i.name === 'trigSuccess')!;
  const trigFail = rive?.stateMachineInputs.find(i => i.name === 'trigFail')!;

  // 4. Update head look based on username length
  useEffect(() => {
    if (numLookInput) {
      numLookInput.value = username.length * MULTIPLIER;
    }
  }, [username, numLookInput]);

  // 5. Trigger checking eye movement on password focus/blur
  const handlePasswordFocus = () => isCheckingInput && (isCheckingInput.value = true);
  const handlePasswordBlur = () => isCheckingInput && (isCheckingInput.value = false);

  // 6. Simulate login on form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      if (password === 'hunter2') {
        trigSuccess?.fire();
      } else {
        trigFail?.fire();
      }
    }, 1500);
  };

  return (
    <div className="login-container">
      <RiveComponent style={{ width: 300, height: 300 }} />
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onFocus={handlePasswordFocus}
          onBlur={handlePasswordBlur}
        />
        <button type="submit" disabled={isChecking}>
          {isChecking ? 'Checking...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
