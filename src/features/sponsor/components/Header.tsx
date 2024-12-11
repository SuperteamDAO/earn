import { DesktopNavbar } from './DesktopNavbar';
import { MobileNavbar } from './MobileNavbar';

export const Header = () => {
  return (
    <div className="sticky top-0 z-[sticky]">
      <DesktopNavbar />
      <MobileNavbar />
    </div>
  );
};
