import React from 'react';

export function CartoonBear({ eyePosition, coverEyes, peekingEyes, mood = 'neutral' }) {
  const getPawsClass = () => {
    const baseClass = 'transition-all duration-300 ease-out';
    if (coverEyes) {
      return `${baseClass} translate-y-0`;
    }
    return `${baseClass} translate-y-[40px]`;
  };

  const renderMouth = () => {
    if (mood === 'happy') {
      return <path d="M75 130 Q100 145 125 130" fill="none" stroke="#8C6B4F" strokeWidth="3" strokeLinecap="round" />;
    } else if (mood === 'angry') {
      return <path d="M80 135 Q100 125 120 135" fill="none" stroke="#8C6B4F" strokeWidth="3" strokeLinecap="round" />;
    }
    return <path d="M85 130 Q100 140 115 130" fill="none" stroke="#8C6B4F" strokeWidth="3" strokeLinecap="round" />;
  };

  const renderEyebrows = () => {
    if (mood === 'angry') {
      return (
        <>
          <path d="M63 75 L83 85" fill="none" stroke="#8C6B4F" strokeWidth="3" strokeLinecap="round" />
          <path d="M117 85 L137 75" fill="none" stroke="#8C6B4F" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    }
    if (mood === 'happy') {
      return (
        <>
          <path d="M63 80 L83 73" fill="none" stroke="#8C6B4F" strokeWidth="3" strokeLinecap="round" />
          <path d="M117 73 L137 80" fill="none" stroke="#8C6B4F" strokeWidth="3" strokeLinecap="round" />
        </>
      );
    }
    return null;
  };

  return (
    <div className="flex justify-center w-full">
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="70" fill="#B08968" />
          <circle cx="40" cy="50" r="25" fill="#8C6B4F" />
          <circle cx="160" cy="50" r="25" fill="#8C6B4F" />
          <circle cx="40" cy="50" r="12" fill="#FFCDB2" />
          <circle cx="160" cy="50" r="12" fill="#FFCDB2" />
          <circle cx="100" cy="110" r="55" fill="#FFCDB2" />
          {renderEyebrows()}
          <g className="eyes-container">
            <circle cx="75" cy="90" r="12" fill="white" />
            <circle
              cx={75 + eyePosition.x}
              cy={90 + eyePosition.y}
              r="6"
              fill="#333"
              className="transition-transform duration-300 ease-out"
            />
            <circle cx="125" cy="90" r="12" fill="white" />
            <circle
              cx={125 + eyePosition.x}
              cy={90 + eyePosition.y}
              r="6"
              fill="#333"
              className="transition-transform duration-300 ease-out"
            />
          </g>
          <ellipse cx="100" cy="115" rx="15" ry="10" fill="#8C6B4F" />
          {renderMouth()}
          <g className={getPawsClass()}>
            <ellipse
              cx="60"
              cy={peekingEyes ? '100' : '90'}
              rx="22"
              ry="20"
              fill="#B08968"
              className="transition-all duration-300 ease-out"
            />
            <ellipse
              cx="50"
              cy={peekingEyes ? '95' : '85'}
              rx="8"
              ry="7"
              fill="#FFCDB2"
              className="transition-all duration-300 ease-out"
            />
            <ellipse
              cx="65"
              cy={peekingEyes ? '92' : '82'}
              rx="8"
              ry="7"
              fill="#FFCDB2"
              className="transition-all duration-300 ease-out"
            />
            <ellipse
              cx="72"
              cy={peekingEyes ? '100' : '90'}
              rx="8"
              ry="7"
              fill="#FFCDB2"
              className="transition-all duration-300 ease-out"
            />
            <path
              d={`M${peekingEyes ? '42' : '45'} ${peekingEyes ? '95' : '85'}
                  C${peekingEyes ? '40' : '43'} ${peekingEyes ? '105' : '95'}
                  ${peekingEyes ? '50' : '53'} ${peekingEyes ? '110' : '100'}
                  ${peekingEyes ? '55' : '58'} ${peekingEyes ? '105' : '95'}`}
              fill="none"
              stroke="#8C6B4F"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
            <ellipse
              cx="140"
              cy={peekingEyes ? '100' : '90'}
              rx="22"
              ry="20"
              fill="#B08968"
              className="transition-all duration-300 ease-out"
            />
            <ellipse
              cx="150"
              cy={peekingEyes ? '95' : '85'}
              rx="8"
              ry="7"
              fill="#FFCDB2"
              className="transition-all duration-300 ease-out"
            />
            <ellipse
              cx="135"
              cy={peekingEyes ? '92' : '82'}
              rx="8"
              ry="7"
              fill="#FFCDB2"
              className="transition-all duration-300 ease-out"
            />
            <ellipse
              cx="128"
              cy={peekingEyes ? '100' : '90'}
              rx="8"
              ry="7"
              fill="#FFCDB2"
              className="transition-all duration-300 ease-out"
            />
            <path
              d={`M${peekingEyes ? '158' : '155'} ${peekingEyes ? '95' : '85'}
                  C${peekingEyes ? '160' : '157'} ${peekingEyes ? '105' : '95'}
                  ${peekingEyes ? '150' : '147'} ${peekingEyes ? '110' : '100'}
                  ${peekingEyes ? '145' : '142'} ${peekingEyes ? '105' : '95'}`}
              fill="none"
              stroke="#8C6B4F"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="transition-all duration-300 ease-out"
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

export default CartoonBear;
