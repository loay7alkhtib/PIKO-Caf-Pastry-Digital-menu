import * as React from 'react';
/* eslint-disable react-refresh/only-export-components */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';
import { Button } from './button';

// Keep only component exports at the top-level to satisfy react-refresh

type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
};

type ConfirmContextValue = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = React.createContext<ConfirmContextValue | null>(null);

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [resolver, setResolver] = React.useState<(value: boolean) => void>();
  const [options, setOptions] = React.useState<ConfirmOptions>({});

  const confirm = React.useCallback((opts?: ConfirmOptions) => {
    setOptions(opts || {});
    setOpen(true);
    return new Promise<boolean>(resolve => {
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = (value: boolean) => {
    setOpen(false);
    resolver?.(value);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options.title ?? 'Are you sure?'}</DialogTitle>
            {options.description ? (
              <DialogDescription>{options.description}</DialogDescription>
            ) : null}
          </DialogHeader>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleClose(false)}
            >
              {options.cancelText ?? 'Cancel'}
            </Button>
            <Button
              type='button'
              onClick={() => handleClose(true)}
              variant={options.destructive ? 'destructive' : 'default'}
            >
              {options.confirmText ?? 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmContextValue {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return ctx;
}
