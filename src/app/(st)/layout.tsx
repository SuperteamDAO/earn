import { stFontVariables } from '@/theme/fonts-st';

import Footer from '@/features/stfun/components/common/Footer';
import Header from '@/features/stfun/components/common/Header';
import StEffects from '@/features/stfun/components/common/StEffects';

// superteam.fun's own pages: their fonts, header and footer, kept out of
// Earn's pages.
export default function StLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className={`${stFontVariables} st-app flex min-h-screen flex-col`}>
      <StEffects />
      <Header className="mx-auto px-10 md:px-[72px]" />
      <div className="relative mx-auto grid flex-1 grid-cols-5 gap-5 px-10 md:px-[72px]">
        {children}
        <Footer />
      </div>
    </div>
  );
}
