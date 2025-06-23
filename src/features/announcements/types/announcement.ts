export interface Announcement {
  id: string;
  title: string;
  Content: React.FC;
  shouldShow: boolean;
  imagesToPreload: string[]; // makes sure while changing the tab , the animation does not suck
  cta: {
    label: string;
    link?: string;
    onClick?: () => void;
  };
}
