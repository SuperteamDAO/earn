import { ExternalImage } from '@/components/ui/cloudinary-image';

interface HighQualityImageProps {
  alt: string;
  src: string;
  className?: string;
}

export const HighQualityImage: React.FC<HighQualityImageProps> = ({
  alt,
  src,
  className,
}) => {
  return <ExternalImage alt={alt} src={src} className={className} />;
};
