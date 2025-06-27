import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { fontMono, fontSans } from '@/theme/fonts';

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <style jsx global>{`
        :root {
          --font-sans: ${fontSans.style.fontFamily};
          --font-mono: ${fontMono.style.fontFamily};
        }
      `}</style>
      <PrivyProvider appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}>
        {children}
      </PrivyProvider>
    </QueryClientProvider>
  );
}
