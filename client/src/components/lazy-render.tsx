import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface LazyRenderProps {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
}

/**
 * LazyRender - Only renders children when element enters viewport
 * Reduces initial load by deferring off-screen content
 * Safe for Vercel deployment - no external dependencies
 */
export function LazyRender({
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0.1,
  className = '',
}: LazyRenderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || isVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isVisible, rootMargin, threshold]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? children : (fallback || <div className="w-full h-full bg-gray-900 animate-pulse" />)}
    </div>
  );
}
