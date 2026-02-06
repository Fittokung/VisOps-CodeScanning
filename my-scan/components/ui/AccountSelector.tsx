// components/ui/AccountSelector.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Loader2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AccountOption {
  id: string;
  name: string;
  username: string;
  isDefault: boolean;
  provider: 'GITHUB' | 'DOCKER';
}

interface AccountSelectorProps {
  label: string;
  icon: LucideIcon;
  options: AccountOption[];
  selectedId: string;
  onChange: (id: string) => void;
  isLoading: boolean;
  onAddNew?: () => void;
  placeholder?: string;
}

/**
 * Reusable account selector dropdown component
 */
export default function AccountSelector({
  label,
  icon: Icon,
  options,
  selectedId,
  onChange,
  isLoading,
  onAddNew,
  placeholder = 'Select account',
}: AccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedAccount = options.find(opt => opt.id === selectedId);

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        <Icon className="w-4 h-4" />
        {label}
      </label>

      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className={`
            w-full flex items-center justify-between gap-2 px-4 py-3
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            rounded-lg text-left transition-all
            ${isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:border-blue-400 dark:hover:border-blue-500'}
            ${isOpen ? 'ring-2 ring-blue-500' : ''}
          `}
        >
          <div className="flex items-center gap-2 min-w-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            ) : (
              <Icon className="w-4 h-4 text-gray-500" />
            )}
            <span className="truncate text-gray-900 dark:text-gray-100">
              {isLoading
                ? 'Loading...'
                : selectedAccount
                  ? selectedAccount.name
                  : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && !isLoading && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No accounts available
              </div>
            ) : (
              options.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3
                    text-sm text-left transition-colors
                    ${selectedId === option.id
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'}
                  `}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{option.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      @{option.username}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {option.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        Default
                      </span>
                    )}
                    {selectedId === option.id && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                </button>
              ))
            )}

            {onAddNew && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700"
              >
                <Plus className="w-4 h-4" />
                Add new account
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
