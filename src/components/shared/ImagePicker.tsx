import { ImagePlus, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { RxUpload } from 'react-icons/rx';
import { toast } from 'sonner';

import { cn } from '@/utils/cn';

import { Input } from '../ui/input';
import { CropModal } from './CropModal';

interface ImagePickerProps {
  onChange?: (file: File, previewUrl: string) => void;
  onReset?: () => void;
  defaultValue?: {
    url: string;
  };
  variant?: 'default' | 'short' | 'banner';
  className?: string;
}

export const ImagePicker = ({
  onChange,
  onReset,
  defaultValue,
  variant = 'default',
  className,
}: ImagePickerProps) => {
  const [preview, setPreview] = useState<string | null>(
    defaultValue?.url ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{
    file: File;
    url: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultValue?.url) {
      setPreview(defaultValue.url);
    }
  }, [defaultValue]);

  // Get optimal dimensions based on variant
  const getOptimalDimensions = () => {
    switch (variant) {
      case 'banner':
        return { width: 848, height: 200 };
      case 'short':
        return { width: 200, height: 200 };
      default:
        return { width: 200, height: 200 }; // Default size
    }
  };

  // Check if image dimensions exceed optimal
  const checkImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const optimal = getOptimalDimensions();
        const exceedsOptimal =
          img.width > optimal.width || img.height > optimal.height;
        resolve(exceedsOptimal);
      };
      img.onerror = () => resolve(false);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (file: File | null | undefined) => {
    if (file) {
      const limit = variant === 'banner' ? 10 : 5;
      if (file.size > limit * 1024 * 1024) {
        toast.error(`The image size must be smaller than ${limit}MB`);
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          'Unsupported file format. Please use JPEG, PNG, or WebP Images.',
        );
        return;
      }

      // Check if dimensions exceed optimal and show crop modal
      const exceedsOptimal = await checkImageDimensions(file);

      if (exceedsOptimal && variant === 'banner') {
        const reader = new FileReader();
        reader.onloadend = () => {
          const previewUrl = reader.result as string;
          setImageToCrop({ file, url: previewUrl });
          setShowCropModal(true);
        };
        reader.readAsDataURL(file);
      } else {
        // Process normally if dimensions are within optimal range
        processImage(file);
      }
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const previewUrl = reader.result as string;
      setPreview(previewUrl);
      onChange && onChange(file, previewUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (croppedFile: File, croppedUrl: string) => {
    setPreview(croppedUrl);
    onChange && onChange(croppedFile, croppedUrl);
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onReset && onReset();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const optimal = getOptimalDimensions();

  if (variant === 'short') {
    return (
      <>
        <div
          className={cn(
            'relative h-14 w-14 rounded-full border bg-slate-100 text-primary',
            !preview && 'border-[1.5px] border-dashed border-primary',
            isDragging && 'bg-primary-200',
            className,
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex h-full w-full overflow-hidden rounded-full">
            {preview ? (
              <img
                className="h-full w-full object-cover"
                src={preview}
                alt="Preview"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {isDragging ? (
                  <ImagePlus className="size-6" />
                ) : (
                  <RxUpload className="size-6" />
                )}
              </div>
            )}
            {preview && (
              <X
                className="absolute bottom-0 right-0 z-10 h-5 w-5 cursor-pointer rounded-full border bg-white stroke-[3] p-1 text-slate-400"
                onClick={handleReset}
              />
            )}
          </div>
          <Input
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => {
              const file = e.target.files ? e.target.files[0] : null;
              handleFileChange(file);
              e.target.value = '';
            }}
            type="file"
          />
          <div
            className="absolute bottom-0 left-0 right-0 top-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          />
        </div>

        {showCropModal && imageToCrop && (
          <CropModal
            isOpen={showCropModal}
            imageFile={imageToCrop.file}
            imageUrl={imageToCrop.url}
            optimalDimensions={optimal}
            variant={variant}
            onComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </>
    );
  } else {
    return (
      <>
        <div
          className={cn(
            'relative mt-2 rounded-md border border-dashed p-4',
            isDragging ? 'border-brand-primary' : 'border-slate-300',
            variant === 'banner' && preview && 'p-0',
            className,
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex">
            {preview ? (
              <img
                className={cn(
                  'h-20 w-20 rounded-xl object-cover',
                  variant === 'banner' && 'h-full w-full rounded-none',
                )}
                src={preview}
                alt="Preview"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100">
                <RxUpload className="size-6 text-slate-500" />
              </div>
            )}
            {preview && (
              <X
                className={cn(
                  'absolute right-3 top-3 z-10 h-5 w-5 cursor-pointer bg-transparent text-slate-400',
                  variant === 'banner' &&
                    preview &&
                    'rounded-full bg-black/50 p-1 text-white hover:bg-black/70',
                )}
                onClick={handleReset}
              />
            )}

            {(variant !== 'banner' || !preview) && (
              <div className="flex flex-col justify-center px-5">
                <p className="mb-1 font-semibold text-slate-500">
                  Choose or drag and drop media
                </p>
                <p className="text-sm text-slate-400">
                  You can add file in JPEG, PNG, or WebP format up to{' '}
                  {variant === 'banner' ? '10 MB' : '5 MB'} in size.
                  <>
                    <br />
                    Optimal dimensions are {optimal.width}x{optimal.height}px
                  </>
                </p>
              </div>
            )}
          </div>
          <Input
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg, image/png, image/webp"
            onChange={(e) => {
              const file = e.target.files ? e.target.files[0] : null;
              handleFileChange(file);
              e.target.value = '';
            }}
            type="file"
          />
          <div
            className="absolute bottom-0 left-0 right-0 top-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          />
        </div>

        {showCropModal && imageToCrop && (
          <CropModal
            isOpen={showCropModal}
            imageFile={imageToCrop.file}
            imageUrl={imageToCrop.url}
            optimalDimensions={optimal}
            variant={variant}
            onComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        )}
      </>
    );
  }
};
