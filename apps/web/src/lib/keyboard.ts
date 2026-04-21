import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsOptions {
  // 1-4 keys for options
  onOptionSelect?: (optionIdx: number) => void;
  
  // N/P for next/previous
  onNext?: () => void;
  onPrev?: () => void;
  
  // S for submit
  onSubmit?: () => void;
  
  // Additional custom key handlers
  customHandlers?: {
    [key: string]: () => void;
  }
  
  // Enable/disable all shortcuts
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onOptionSelect,
  onNext,
  onPrev,
  onSubmit,
  customHandlers = {},
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore keyboard shortcuts when typing in input fields
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      !enabled
    ) {
      return;
    }
    
    // Number keys 1-4 for options
    if (['1', '2', '3', '4'].includes(e.key) && onOptionSelect) {
      const optionIdx = parseInt(e.key) - 1;
      onOptionSelect(optionIdx);
    }
    
    // N for next
    if ((e.key === 'n' || e.key === 'N') && onNext) {
      onNext();
    }
    
    // P for previous
    if ((e.key === 'p' || e.key === 'P') && onPrev) {
      onPrev();
    }
    
    // S for submit
    if ((e.key === 's' || e.key === 'S') && onSubmit) {
      onSubmit();
    }
    
    // Custom key handlers
    const handler = customHandlers[e.key];
    if (handler) {
      handler();
    }
  }, [onOptionSelect, onNext, onPrev, onSubmit, customHandlers, enabled]);
  
  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

// Check if device is likely a touch device
export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    (navigator.msMaxTouchPoints !== undefined && navigator.msMaxTouchPoints > 0)
  );
}

// Help text for keyboard shortcuts
export function getKeyboardShortcutsHelp() {
  return [
    { key: '1-4', description: 'Select option' },
    { key: 'N', description: 'Next question' },
    { key: 'P', description: 'Previous question' },
    { key: 'S', description: 'Submit exam' },
  ];
}