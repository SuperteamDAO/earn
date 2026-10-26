import type { ReactNode } from 'react';

// TEMPORARY STUB while the dashboard area rebuilds the sponsor dashboard's
// frame for the App Router. Same export and props as Earn's.
export function SponsorLayout({
  children,
}: {
  children: ReactNode;
  isCollapsible?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center border-b border-slate-200 px-4">
        <a href="/earn/dashboard/listings/" className="font-semibold">
          Sponsor dashboard
        </a>
      </header>
      <div className="flex flex-1">
        <main className="w-full px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
