'use client';

import { toast as sonnerToast } from 'sonner';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { createElement } from 'react';

/**
 * Toast options interface
 */
export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
  cancel?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  };
}

/**
 * Custom hook for toast notifications
 * Provides a clean API for showing success, error, info, warning, and loading toasts
 *
 * @example
 * ```tsx
 * const toast = useToast();
 *
 * toast.success('Operation successful!');
 * toast.error('Something went wrong');
 * toast.loading('Processing...');
 * ```
 */
export function useToast() {
  /**
   * Show success toast
   */
  const success = (message: string, options?: ToastOptions) => {
    return sonnerToast.success(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
      icon: createElement(CheckCircle2, {
        size: 20,
        className: 'text-(--color-success)',
      }),
    });
  };

  /**
   * Show error toast
   */
  const error = (message: string, options?: ToastOptions) => {
    return sonnerToast.error(message, {
      description: options?.description,
      duration: options?.duration || 7000, // Errors stay longer
      action: options?.action,
      cancel: options?.cancel,
      icon: createElement(AlertCircle, {
        size: 20,
        className: 'text-(--color-error)',
      }),
    });
  };

  /**
   * Show info toast
   */
  const info = (message: string, options?: ToastOptions) => {
    return sonnerToast.info(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
      icon: createElement(Info, {
        size: 20,
        className: 'text-(--color-info)',
      }),
    });
  };

  /**
   * Show warning toast
   */
  const warning = (message: string, options?: ToastOptions) => {
    return sonnerToast.warning(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
      icon: createElement(AlertTriangle, {
        size: 20,
        className: 'text-(--color-warning)',
      }),
    });
  };

  /**
   * Show loading toast
   * Returns toast ID for updating/dismissing later
   */
  const loading = (message: string, options?: Omit<ToastOptions, 'action' | 'cancel'>) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      duration: Infinity, // Loading toasts don't auto-dismiss
      icon: createElement(Loader2, {
        size: 20,
        className: 'text-(--color-primary) animate-spin',
      }),
    });
  };

  /**
   * Show promise toast
   * Automatically shows loading, success, or error based on promise state
   */
  const promise = <T,>(
    promise: Promise<T>,
    {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: loadingMessage,
      success: successMessage,
      error: errorMessage,
    });
  };

  /**
   * Dismiss a specific toast by ID
   */
  const dismiss = (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  };

  /**
   * Dismiss all toasts
   */
  const dismissAll = () => {
    sonnerToast.dismiss();
  };

  /**
   * Show custom toast
   */
  const custom = (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel,
    });
  };

  /**
   * MCP-specific toasts with custom styling
   */
  const mcpAdded = (mcpName: string) => {
    return success(`MCP "${mcpName}" added successfully`, {
      description: 'The MCP server is now connected and ready to use',
    });
  };

  const mcpRemoved = (mcpName: string) => {
    return info(`MCP "${mcpName}" removed`, {
      description: 'The MCP server has been disconnected',
    });
  };

  const mcpError = (mcpName: string, errorMessage?: string) => {
    return error(`MCP "${mcpName}" error`, {
      description: errorMessage || 'Failed to connect to the MCP server',
    });
  };

  /**
   * Context-specific toasts
   */
  const contextAdded = (count: number = 1) => {
    return success(
      `${count} context ${count === 1 ? 'item' : 'items'} added`,
      {
        description: 'New context has been synced successfully',
      }
    );
  };

  const contextUpdated = () => {
    return success('Context updated', {
      description: 'Changes have been saved successfully',
    });
  };

  const contextDeleted = (count: number = 1) => {
    return info(
      `${count} context ${count === 1 ? 'item' : 'items'} deleted`,
      {
        description: 'Context has been removed from the system',
      }
    );
  };

  /**
   * Team-specific toasts
   */
  const memberInvited = (email: string) => {
    return success('Invitation sent', {
      description: `An invitation has been sent to ${email}`,
    });
  };

  const memberRemoved = (name: string) => {
    return info(`${name} removed from team`, {
      description: 'Team member has been removed successfully',
    });
  };

  /**
   * Settings-specific toasts
   */
  const settingsSaved = () => {
    return success('Settings saved', {
      description: 'Your changes have been applied successfully',
    });
  };

  const apiKeyRegenerated = () => {
    return warning('API key regenerated', {
      description: 'Make sure to update your applications with the new key',
      duration: 8000,
    });
  };

  return {
    // Core toast methods
    success,
    error,
    info,
    warning,
    loading,
    promise,
    custom,

    // Control methods
    dismiss,
    dismissAll,

    // Domain-specific toasts
    mcpAdded,
    mcpRemoved,
    mcpError,
    contextAdded,
    contextUpdated,
    contextDeleted,
    memberInvited,
    memberRemoved,
    settingsSaved,
    apiKeyRegenerated,
  };
}
