import Link from 'next/link';

import { OgImageViewer } from '@/components/shared/ogImageViewer';

export const ReferenceCard = ({
  link,
  title,
}: {
  link?: string;
  title?: string;
}) => {
  if (!link) return <></>;
  return (
    <Link
      className="w-full cursor-pointer rounded-lg"
      href={link}
      target="_blank"
    >
      <OgImageViewer
        showTitle
        title={title}
        externalUrl={link}
        className="aspect-[1.91/1] w-full rounded-md object-cover"
      />
    </Link>
  );
};
