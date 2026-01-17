/**
 * Development utility functions
 * These help conditionally execute code only in development mode
 */

export const isDev = (): boolean => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

export const devLog = (...args: any[]): void => {
  if (isDev()) {
    console.log(...args);
  }
};

export const devWarn = (...args: any[]): void => {
  if (isDev()) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]): void => {
  if (isDev()) {
    console.error(...args);
  }
};
