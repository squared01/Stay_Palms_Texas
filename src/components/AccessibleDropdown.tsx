import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface AccessibleDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  id: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  className?: string;
}

export const AccessibleDropdown: React.FC<AccessibleDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  label,
  id,
  disabled = false,
  error,
  required = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (!isOpen) {
          event.preventDefault();
          setIsOpen(true);
        } else if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
          event.preventDefault();
          onChange(filteredOptions[focusedIndex].value);
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
          buttonRef.current?.focus();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        setSearchTerm('');
        setFocusedIndex(-1);
        break;
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      handleKeyDown(event);
    } else if (event.key === 'Enter' && focusedIndex >= 0) {
      event.preventDefault();
      onChange(filteredOptions[focusedIndex].value);
      setIsOpen(false);
      setSearchTerm('');
      setFocusedIndex(-1);
      buttonRef.current?.focus();
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      setFocusedIndex(-1);
      buttonRef.current?.focus();
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setFocusedIndex(-1);
    buttonRef.current?.focus();
  };

  const dropdownId = `${id}-dropdown`;
  const searchId = `${id}-search`;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label 
        htmlFor={id}
        className="block text-sm font-semibold text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? errorId : undefined}
        className={`
          w-full px-4 py-3 text-left border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-white hover:border-gray-300 cursor-pointer'
          }
          ${error 
            ? 'border-red-300 focus:ring-red-500' 
            : 'border-gray-200'
          }
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
        `}
      >
        <span className="flex items-center justify-between">
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search input for large option lists */}
          {options.length > 5 && (
            <div className="p-2 border-b border-gray-100">
              <input
                ref={searchInputRef}
                id={searchId}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFocusedIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search options..."
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-label="Search options"
              />
            </div>
          )}
          
          <ul
            ref={listRef}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className="max-h-60 overflow-auto py-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500">
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  className={`
                    px-4 py-2 text-sm cursor-pointer flex items-center justify-between
                    ${option.disabled 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-900 hover:bg-blue-50'
                    }
                    ${index === focusedIndex ? 'bg-blue-100' : ''}
                    ${option.value === value ? 'bg-blue-50 font-semibold' : ''}
                  `}
                  onClick={() => !option.disabled && handleOptionClick(option.value)}
                  onMouseEnter={() => !option.disabled && setFocusedIndex(index)}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-blue-600" aria-hidden="true" />
                  )}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};