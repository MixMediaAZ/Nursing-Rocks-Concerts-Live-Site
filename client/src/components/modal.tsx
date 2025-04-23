import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
  hideCloseButton?: boolean;
}

/**
 * A simple modal component that stays open until explicitly closed
 */
export function Modal({
  isVisible,
  onClose,
  title,
  children,
  width = 'max-w-2xl',
  hideCloseButton = false
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap inside the modal for accessibility
  useEffect(() => {
    if (!isVisible) return;
    
    // Auto-focus close button when modal opens
    setTimeout(() => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
      }
    }, 50);
    
    // Prevent scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    // Handle escape key press
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // We don't auto-close the modal with ESC - only through explicit button click
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible]);

  // Don't render anything if not visible
  if (!isVisible) return null;

  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl overflow-hidden ${width} mx-4 my-8`}
        onClick={handleModalClick}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          {title && (
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          )}
          {!hideCloseButton && (
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}