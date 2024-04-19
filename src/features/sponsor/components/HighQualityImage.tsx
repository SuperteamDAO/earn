import Image, { type ImageProps } from 'next/image';

interface HighQualityImageProps extends ImageProps {
  alt: string; // Making 'alt' explicitly required
}

export const HighQualityImage: React.FC<HighQualityImageProps> = ({
  alt,
  ...props
}) => {
  return <Image alt={alt} {...props} quality={90} />;
};
