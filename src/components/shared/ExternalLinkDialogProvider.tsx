import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExternalLinkDialogContextValue {
  openExternalLinkDialog: (url: string) => void;
}

const ExternalLinkDialogContext =
  createContext<ExternalLinkDialogContextValue | null>(null);

function isExternalLink(url: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    return parsedUrl.origin !== window.location.origin;
  } catch {
    return false;
  }
}

export function ExternalLinkDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const openExternalLinkDialog = useCallback((url: string) => {
    setPendingUrl(url);
    setIsOpen(true);
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPendingUrl(null);
    }
  }, []);

  const openLink = useCallback(() => {
    if (pendingUrl) {
      window.open(pendingUrl, '_blank', 'noopener,noreferrer');
    }
    setPendingUrl(null);
    setIsOpen(false);
  }, [pendingUrl]);

  const contextValue = useMemo(
    () => ({ openExternalLinkDialog }),
    [openExternalLinkDialog],
  );

  return (
    <ExternalLinkDialogContext.Provider value={contextValue}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-lg p-5 sm:p-6">
          <AlertDialogHeader className="space-y-3 text-left">
            <AlertDialogTitle className="text-lg leading-tight font-semibold tracking-tight sm:text-xl">
              Open external link
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm sm:text-base">
              You&apos;re leaving Superteam Earn to visit an external link:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-muted/50 text-foreground w-full rounded-md border px-3 py-2.5 text-sm break-all sm:text-base">
            {pendingUrl}
          </div>
          <AlertDialogFooter className="mt-1 gap-2 sm:gap-3">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto" onClick={openLink}>
              Open link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ExternalLinkDialogContext.Provider>
  );
}

export function useExternalLinkDialog() {
  const context = useContext(ExternalLinkDialogContext);

  if (!context) {
    throw new Error(
      'useExternalLinkDialog must be used within ExternalLinkDialogProvider',
    );
  }

  const { openExternalLinkDialog } = context;

  const handleExternalLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, url: string) => {
      if (!isExternalLink(url)) {
        return;
      }

      event.preventDefault();
      openExternalLinkDialog(url);
    },
    [openExternalLinkDialog],
  );

  return {
    handleExternalLinkClick,
  };
}
