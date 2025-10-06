'use client';
import { Slot } from '@radix-ui/react-slot';
import { CropIcon, RotateCcwIcon } from 'lucide-react';
import {
  type ComponentProps,
  createContext,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefObject,
  type SyntheticEvent,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactCrop, {
  centerCrop,
  makeAspectCrop,
  type PercentCrop,
  type PixelCrop,
  type ReactCropProps,
} from 'react-image-crop';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

import 'react-image-crop/dist/ReactCrop.css';

const centerAspectCrop = (
  mediaWidth: number,
  mediaHeight: number,
  aspect: number | undefined,
): PercentCrop =>
  centerCrop(
    aspect
      ? makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspect,
          mediaWidth,
          mediaHeight,
        )
      : { x: 0, y: 0, width: 90, height: 90, unit: '%' },
    mediaWidth,
    mediaHeight,
  );

const dataURLToBlob = (dataURL: string): Blob => {
  if (!dataURL || !dataURL.includes(',')) {
    throw new Error('Invalid data URL');
  }
  const arr = dataURL.split(',');
  const mime = arr[0]?.match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1] || '');
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

const getCroppedPngImage = async (
  imageSrc: HTMLImageElement,
  scaleFactor: number,
  pixelCrop: PixelCrop,
  maxImageSize: number,
): Promise<string> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Context is null, this should never happen.');
  }
  const scaleX = imageSrc.naturalWidth / imageSrc.width;
  const scaleY = imageSrc.naturalHeight / imageSrc.height;
  ctx.imageSmoothingEnabled = false;
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    imageSrc,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );
  const croppedImageUrl = canvas.toDataURL('image/png');
  const blob = dataURLToBlob(croppedImageUrl);
  if (blob.size > maxImageSize) {
    return await getCroppedPngImage(
      imageSrc,
      scaleFactor * 0.9,
      pixelCrop,
      maxImageSize,
    );
  }
  return croppedImageUrl;
};

type ImageCropContextType = {
  file: File;
  maxImageSize: number;
  imgSrc: string;
  crop: PercentCrop | undefined;
  completedCrop: PixelCrop | null;
  imgRef: RefObject<HTMLImageElement | null>;
  onCrop?: (croppedImage: string) => void;
  reactCropProps: Omit<ReactCropProps, 'onChange' | 'onComplete' | 'children'>;
  handleChange: (pixelCrop: PixelCrop, percentCrop: PercentCrop) => void;
  handleComplete: (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop,
  ) => Promise<void>;
  onImageLoad: (e: SyntheticEvent<HTMLImageElement>) => void;
  applyCrop: () => Promise<void>;
  resetCrop: () => void;
};

const ImageCropContext = createContext<ImageCropContextType | null>(null);

const useImageCrop = () => {
  const context = useContext(ImageCropContext);
  if (!context) {
    throw new Error('ImageCrop components must be used within ImageCrop');
  }
  return context;
};

export type ImageCropProps = {
  file: File;
  maxImageSize?: number;
  onCrop?: (croppedImage: string) => void;
  children: ReactNode;
  onChange?: ReactCropProps['onChange'];
  onComplete?: ReactCropProps['onComplete'];
} & Omit<ReactCropProps, 'onChange' | 'onComplete' | 'children'>;

export const ImageCrop = ({
  file,
  maxImageSize = 1024 * 1024 * 5,
  onCrop,
  children,
  onChange,
  onComplete,
  ...reactCropProps
}: ImageCropProps) => {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSrc, setImgSrc] = useState<string>('');
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [initialCrop, setInitialCrop] = useState<PercentCrop>();
  useEffect(() => {
    const reader = new FileReader();
    reader.addEventListener('load', () =>
      setImgSrc(reader.result?.toString() || ''),
    );
    reader.readAsDataURL(file);
  }, [file]);
  const onImageLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const newCrop = centerAspectCrop(width, height, reactCropProps.aspect);
      setCrop(newCrop);
      setInitialCrop(newCrop);
    },
    [reactCropProps.aspect],
  );
  const handleChange = (pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
    setCrop(percentCrop);
    onChange?.(pixelCrop, percentCrop);
  };

  const handleComplete = async (
    pixelCrop: PixelCrop,
    percentCrop: PercentCrop,
  ) => {
    setCompletedCrop(pixelCrop);
    onComplete?.(pixelCrop, percentCrop);
  };
  const applyCrop = async () => {
    if (!(imgRef.current && completedCrop)) {
      return;
    }
    const croppedImage = await getCroppedPngImage(
      imgRef.current,
      1,
      completedCrop,
      maxImageSize,
    );
    onCrop?.(croppedImage);
  };
  const resetCrop = () => {
    if (initialCrop) {
      setCrop(initialCrop);
      setCompletedCrop(null);
    }
  };
  const contextValue: ImageCropContextType = {
    file,
    maxImageSize,
    imgSrc,
    crop,
    completedCrop,
    imgRef,
    onCrop,
    reactCropProps,
    handleChange,
    handleComplete,
    onImageLoad,
    applyCrop,
    resetCrop,
  };
  return (
    <ImageCropContext.Provider value={contextValue}>
      {children}
    </ImageCropContext.Provider>
  );
};
export type ImageCropContentProps = {
  style?: CSSProperties;
  className?: string;
};
export const ImageCropContent = ({
  style,
  className,
}: ImageCropContentProps) => {
  const {
    imgSrc,
    crop,
    handleChange,
    handleComplete,
    onImageLoad,
    imgRef,
    reactCropProps,
  } = useImageCrop();
  const shadcnStyle = {
    '--rc-border-color': 'var(--color-border)',
    '--rc-focus-color': 'var(--color-primary)',
  } as CSSProperties;
  return (
    <div className="flex justify-center bg-gray-200">
      <ReactCrop
        className={cn('mx-auto max-h-[17.3125rem] w-fit', className)}
        crop={crop}
        onChange={handleChange}
        onComplete={handleComplete}
        style={{ ...shadcnStyle, ...style }}
        {...reactCropProps}
      >
        {imgSrc && (
          <img
            alt="crop"
            className="size-full object-contain"
            onLoad={onImageLoad}
            ref={imgRef}
            src={imgSrc}
          />
        )}
      </ReactCrop>
    </div>
  );
};
export type ImageCropApplyProps = ComponentProps<'button'> & {
  asChild?: boolean;
};
export const ImageCropApply = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropApplyProps) => {
  const { applyCrop } = useImageCrop();
  const handleClick = async (e: MouseEvent<HTMLButtonElement>) => {
    await applyCrop();
    onClick?.(e);
  };
  if (asChild) {
    return (
      <Slot onClick={handleClick} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <Button onClick={handleClick} size="icon" variant="ghost" {...props}>
      {children ?? <CropIcon className="size-4" />}
    </Button>
  );
};
export type ImageCropResetProps = ComponentProps<'button'> & {
  asChild?: boolean;
};
export const ImageCropReset = ({
  asChild = false,
  children,
  onClick,
  ...props
}: ImageCropResetProps) => {
  const { resetCrop } = useImageCrop();
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    resetCrop();
    onClick?.(e);
  };
  if (asChild) {
    return (
      <Slot onClick={handleClick} {...props}>
        {children}
      </Slot>
    );
  }
  return (
    <Button onClick={handleClick} size="icon" variant="ghost" {...props}>
      {children ?? <RotateCcwIcon className="size-4" />}
    </Button>
  );
};

export type CropperProps = Omit<ReactCropProps, 'onChange'> & {
  file: File;
  maxImageSize?: number;
  onCrop?: (croppedImage: string) => void;
  onChange?: ReactCropProps['onChange'];
};
export const Cropper = ({
  onChange,
  onComplete,
  onCrop,
  style,
  className,
  file,
  maxImageSize,
  ...props
}: CropperProps) => (
  <ImageCrop
    file={file}
    maxImageSize={maxImageSize}
    onChange={onChange}
    onComplete={onComplete}
    onCrop={onCrop}
    {...props}
  >
    <ImageCropContent className={className} style={style} />
  </ImageCrop>
);
