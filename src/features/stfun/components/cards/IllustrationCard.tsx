import { cn } from '@/utils/cn';

import ImageLoader from '../ImageLoader';

interface IllustrationCardProps {
  imageUrl: string;
  text: string;
  className?: string;
  onClick?: () => void;
}

export default function IllustrationCard({
  imageUrl,
  text,
  className,
  onClick,
}: IllustrationCardProps) {
  return (
    <div
      className={cn('image-with-text z-1 cursor-pointer rounded-lg', className)}
      onClick={onClick}
    >
      <div className="image-with-text-content relative h-full min-h-[298px] w-full min-w-[238px] overflow-hidden rounded-lg">
        <ImageLoader
          src={imageUrl}
          width={240}
          height={300}
          className="absolute z-10 h-full w-full rounded-lg object-cover"
          loading="lazy"
          alt=""
        />
        <p className="text-on-image absolute top-[32px] left-[32px] z-10 text-left text-[20px] font-semibold text-white md:text-[28px]">
          {text}
        </p>
      </div>
    </div>
  );
}
