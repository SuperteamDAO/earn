import { DesktopNavbar } from './DesktopNavbar';
import { MobileNavbar } from './MobileNavbar';

export const Header = ({ resuming }: { resuming: boolean }) => {
  return (
    <div className="sticky top-0 z-40">
      <DesktopNavbar resuming={resuming} />
      <MobileNavbar resuming={resuming} />
    </div>
  );
};
