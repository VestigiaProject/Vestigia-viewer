import { toast } from '@/components/ui/use-toast';

type ErrorOptions = {
  // The user-friendly message to show
  userMessage?: string;
  // Whether to show a toast notification (default: true)
  showToast?: boolean;
  // Additional context for logging
  context?: Record<string, unknown>;
};

/**
 * Centralized error handling utility
 * @param error The error object
 * @param options Configuration options for error handling
 */
export function handleError(error: unknown, options: ErrorOptions = {}) {
  const {
    userMessage = 'An unexpected error occurred',
    showToast = true,
    context = {},
  } = options;

  // Log the error with additional context
  console.error('Error occurred:', {
    error,
    ...context,
  });

  // Show toast notification if enabled
  if (showToast) {
    toast({
      title: 'Error',
      description: userMessage,
      variant: 'destructive',
    });
  }

  // Return the error for optional chaining
  return error;
}

/**
 * Type guard to check if an error has a message property
 */
export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

/**
 * Get a user-friendly error message from an error object
 */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  return 'An unexpected error occurred';
} 