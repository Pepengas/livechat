import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageActionsMenu from './MessageActionsMenu';

describe('MessageActionsMenu', () => {
  function Wrapper({ onReply = () => {} }) {
    const [open, setOpen] = React.useState(false);
    return (
      <MessageActionsMenu
        isOpen={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onReply={onReply}
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
    fireEvent.click(screen.getByTestId('backdrop'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('closes on escape key', () => {
    render(<Wrapper />);
    const button = screen.getByLabelText(/more options/i);
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('reply is first option and triggers callback', () => {
    const handleReply = jest.fn();
    render(<Wrapper onReply={handleReply} />);
    const button = screen.getByLabelText(/more options/i);
    fireEvent.click(button);
    const items = screen.getAllByRole('menuitem');
    expect(items[0]).toHaveTextContent(/reply/i);
    fireEvent.click(items[0]);
    expect(handleReply).toHaveBeenCalled();
  });
});

