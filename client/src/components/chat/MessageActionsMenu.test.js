import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageActionsMenu from './MessageActionsMenu';

describe('MessageActionsMenu', () => {
  function Wrapper() {
    const [open, setOpen] = React.useState(false);
    return (
      <MessageActionsMenu
        isOpen={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onCopy={() => {}}
        onStartThread={() => {}}
        onDelete={() => {}}
        showStartThread
        showDelete
        isTouch={false}
      />
    );
  }

  test('opens and closes on outside click', () => {
    render(<Wrapper />);
    const button = screen.getByLabelText(/more options/i);
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('closes on escape key', () => {
    render(<Wrapper />);
    const button = screen.getByLabelText(/more options/i);
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

