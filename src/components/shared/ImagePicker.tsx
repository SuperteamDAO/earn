import { ImagePlus, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import RxUpload from '@/components/icons/RxUpload';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ImageCrop,
  ImageCropApply,
  ImageCropContent,
} from '@/components/ui/image-crop';
import { cn } from '@/utils/cn';

import { Input } from '../ui/input';

interface ImagePickerProps {
  onChange?: (file: File, previewUrl: string) => void;
  onReset?: () => void;
  defaultValue?: {
    url: string;
  };
  variant?: 'default' | 'short';
  crop?: boolean | 'square';
  className?: string;
}

export const ImagePicker = ({
  onChange,
  onReset,
  defaultValue,
  variant = 'default',
  crop = false,
  className,
}: ImagePickerProps) => {
  const [preview, setPreview] = useState<string | null>(
    defaultValue?.url ?? null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dataURLToFile = (dataURL: string, filename: string): File => {
    if (!dataURL) {
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
    return new File([u8arr], filename, { type: mime });
  };

  useEffect(() => {
    if (defaultValue?.url) {
      setPreview(defaultValue.url);
    }
  }, [defaultValue]);

  const handleFileChange = (file: File | null | undefined) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`The image size must be smaller than 5MB`);
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          'Unsupported file format. Please use JPEG, PNG, or WebP Images.',
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result as string;
        if (crop) {
          setSelectedFile(file);
          setShowCropModal(true);
        } else {
          setPreview(previewUrl);
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          onChange && onChange(file, previewUrl);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onReset && onReset();
  };

  const handleCropApply = (croppedImageDataUrl: string) => {
    if (selectedFile) {
      const croppedFile = dataURLToFile(croppedImageDataUrl, selectedFile.name);
      setPreview(croppedImageDataUrl);
      setShowCropModal(false);
      setSelectedFile(null);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      onChange && onChange(croppedFile, croppedImageDataUrl);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  return (
    <>
      {variant === 'short' ? (
        <div
          className={cn(
            'text-primary relative h-14 w-14 rounded-full border bg-slate-100',
            !preview && 'border-primary border-[1.5px] border-dashed',
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
                className="absolute right-0 bottom-0 z-10 h-5 w-5 cursor-pointer rounded-full border bg-white stroke-3 p-1 text-slate-400"
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
            className="absolute top-0 right-0 bottom-0 left-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          />
        </div>
      ) : (
        <div
          className={cn(
            'relative mt-2 rounded-md border border-dashed p-4',
            isDragging ? 'border-brand-primary' : 'border-slate-300',
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
                className="h-20 w-20 rounded-xl object-cover"
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
                className="absolute top-3 right-3 z-10 h-5 w-5 cursor-pointer bg-transparent text-slate-400"
                onClick={handleReset}
              />
            )}

            <div className="flex flex-col justify-center px-5">
              <p className="mb-1 font-semibold text-slate-500">
                Choose or drag and drop media
              </p>
              <p className="text-sm text-slate-400">Maximum size 5 MB</p>
            </div>
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
            className="absolute top-0 right-0 bottom-0 left-0 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          />
        </div>
      )}

      <Dialog open={showCropModal} onOpenChange={handleCropCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription>
              Adjust the crop area to select the portion of the image you want
              to keep.
            </DialogDescription>
          </DialogHeader>

          {selectedFile && (
            <ImageCrop
              file={selectedFile}
              onCrop={handleCropApply}
              maxImageSize={5 * 1024 * 1024}
              aspect={crop === 'square' ? 1 : undefined}
            >
              <ImageCropContent className="max-h-96" />

              <DialogFooter>
                <Button variant="outline" onClick={handleCropCancel}>
                  Cancel
                </Button>
                <ImageCropApply asChild>
                  <Button>Apply</Button>
                </ImageCropApply>
              </DialogFooter>
            </ImageCrop>
          )}

          {!selectedFile && (
            <DialogFooter>
              <Button variant="outline" onClick={handleCropCancel}>
                Cancel
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
