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
  return <img alt={alt} src={src} className={className} />;
};
