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
    <div
      className="w-full cursor-pointer rounded-lg"
      onClick={() => window.open(link, '_blank')}
    >
      <OgImageViewer
        showTitle
        title={title}
        externalUrl={link}
        className="aspect-[1.91/1] w-full rounded-md object-cover"
      />
    </div>
  );
};
