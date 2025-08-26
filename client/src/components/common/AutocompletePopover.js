import React, { useState, useEffect, useRef } from 'react';

const AutocompletePopover = ({ items, anchorRect, onSelect, onClose, query = '', trigger }) => {
  const [highlightIndex, setHighlightIndex] = useState(0);
  const popoverRef = useRef(null);

  useEffect(() => {
    setHighlightIndex(0);
  }, [items]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!items || items.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onSelect(items[highlightIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [items, highlightIndex, onSelect, onClose]);

  useEffect(() => {
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  if (!items || items.length === 0 || !anchorRect) return null;

  const style = {
    top: anchorRect.bottom + 4,
    left: anchorRect.left,
  };

  const renderName = (name) => {
    const lower = name.toLowerCase();
    const q = query.toLowerCase();
    const idx = lower.indexOf(q);
    if (!q || idx === -1) return name;
    return (
      <>
        {name.slice(0, idx)}
        <span className="font-semibold">{name.slice(idx, idx + q.length)}</span>
        {name.slice(idx + q.length)}
      </>
    );
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-56 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg"
      style={style}
    >
      {items.map((item, idx) => (
        <div
          key={item._id}
          className={`px-3 py-2 flex items-center cursor-pointer ${idx === highlightIndex ? 'bg-gray-100 dark:bg-gray-600' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}
          onMouseEnter={() => setHighlightIndex(idx)}
        >
          {item.avatar ? (
            <img src={item.avatar} alt="" className="h-6 w-6 rounded-full mr-2" />
          ) : (
            <div className="h-6 w-6 mr-2 flex items-center justify-center text-gray-500">
              {trigger === '@' ? '@' : '#'}
            </div>
          )}
          <span className="truncate">{renderName(item.name)}</span>
        </div>
      ))}
    </div>
  );
};

export default AutocompletePopover;

