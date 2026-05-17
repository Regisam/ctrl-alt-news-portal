/**
 * Global type definitions for Google Analytics and other globals
 */

interface Window {
  gtag?: (command: string, action: string, params?: Record<string, unknown>) => void;
}
