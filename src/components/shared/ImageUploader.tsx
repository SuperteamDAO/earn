'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useImageUpload } from '@/hooks/use-image-upload';
import {
  type ImageSource,
  MAX_FILE_SIZE,
  type UploadResult,
} from '@/lib/image-upload/client';
import { cn } from '@/utils/cn';

type ImageUploaderVariant = 'default' | 'avatar' | 'banner';

interface ImageUploaderProps {
  source: ImageSource;
  onChange?: (result: UploadResult) => void;
  onReset?: () => void;
  defaultValue?: string;
  variant?: ImageUploaderVariant;
  crop?: boolean | 'square';
  className?: string;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function dataURLToFile(dataURL: string, filename: string): File {
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
}

export function ImageUploader({
  source,
  onChange,
  onReset,
  defaultValue,
  variant = 'default',
  crop = false,
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(defaultValue ?? null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadAndReplace, uploading, progress, reset } = useImageUpload({
    source,
    onError: (err) => {
      toast.error('Upload failed', {
        description: err.message,
      });
    },
  });

  const maxSizeMB = useMemo(
    () => Math.round(MAX_FILE_SIZE / (1024 * 1024)),
    [],
  );

  useEffect(() => {
    if (defaultValue) {
      setPreview(defaultValue);
    }
  }, [defaultValue]);

  const processUpload = useCallback(
    async (file: File) => {
      try {
        const result = await uploadAndReplace(file, preview || undefined);
        setPreview(result.secureUrl);
        onChange?.(result);
      } catch {}
    },
    [uploadAndReplace, preview, onChange],
  );

  const handleFileChange = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error(`The image size must be smaller than ${maxSizeMB}MB`);
        return;
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(
          'Unsupported file format. Please use JPEG, PNG, or WebP images.',
        );
        return;
      }

      if (crop) {
        setSelectedFile(file);
        setShowCropModal(true);
      } else {
        await processUpload(file);
      }
    },
    [crop, maxSizeMB, processUpload],
  );

  const handleReset = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setPreview(null);
      reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onReset?.();
    },
    [reset, onReset],
  );

  const handleCropApply = useCallback(
    async (croppedImageDataUrl: string) => {
      if (!selectedFile) return;

      const croppedFile = dataURLToFile(croppedImageDataUrl, selectedFile.name);
      setShowCropModal(false);
      setSelectedFile(null);

      await processUpload(croppedFile);
    },
    [selectedFile, processUpload],
  );

  const handleCropCancel = useCallback(() => {
    setShowCropModal(false);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || uploading) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileChange(files[0]);
      }
    },
    [disabled, uploading, handleFileChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files ? e.target.files[0] : null;
      handleFileChange(file);
      e.target.value = '';
    },
    [handleFileChange],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled && !uploading) {
        fileInputRef.current?.click();
      }
    },
    [disabled, uploading],
  );

  const renderAvatar = () => (
    <div
      className={cn(
        'text-primary relative h-14 w-14 rounded-full border bg-slate-100',
        !preview && 'border-primary border-[1.5px] border-dashed',
        isDragging && 'bg-primary-200',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex h-full w-full overflow-hidden rounded-full">
        {uploading ? (
          <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : preview ? (
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
        {preview && !uploading && (
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
        onChange={handleInputChange}
        type="file"
        disabled={disabled || uploading}
      />
      <div
        className="absolute top-0 right-0 bottom-0 left-0 cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );

  const renderDefault = () => (
    <div
      className={cn(
        'relative mt-2 rounded-md border border-dashed p-4',
        isDragging ? 'border-brand-primary' : 'border-slate-300',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex">
        {uploading ? (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100">
            <Loader2 className="size-6 animate-spin text-slate-500" />
          </div>
        ) : preview ? (
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
        {preview && !uploading && (
          <X
            className="absolute top-3 right-3 z-10 h-5 w-5 cursor-pointer bg-transparent text-slate-400"
            onClick={handleReset}
          />
        )}

        <div className="flex flex-col justify-center px-5">
          {uploading ? (
            <>
              <p className="mb-1 font-semibold text-slate-500">Uploading...</p>
              <Progress value={progress} className="h-2 w-32" />
            </>
          ) : (
            <>
              <p className="mb-1 font-semibold text-slate-500">
                Choose or drag and drop media
              </p>
              <p className="text-sm text-slate-400">
                Maximum size {maxSizeMB} MB
              </p>
            </>
          )}
        </div>
      </div>
      <Input
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleInputChange}
        type="file"
        disabled={disabled || uploading}
      />
      <div
        className="absolute top-0 right-0 bottom-0 left-0 cursor-pointer"
        onClick={handleClick}
      />
    </div>
  );

  const renderBanner = () => (
    <div
      className={cn(
        'relative h-40 w-full rounded-lg border border-dashed',
        isDragging ? 'border-brand-primary bg-slate-50' : 'border-slate-300',
        preview && 'border-none',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2">
          <Loader2 className="size-8 animate-spin text-slate-500" />
          <Progress value={progress} className="h-2 w-32" />
        </div>
      ) : preview ? (
        <>
          <img
            className="h-full w-full rounded-lg object-cover"
            src={preview}
            alt="Preview"
          />
          <X
            className="absolute top-2 right-2 z-10 h-6 w-6 cursor-pointer rounded-full bg-white p-1 text-slate-600 shadow"
            onClick={handleReset}
          />
        </>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center">
          {isDragging ? (
            <ImagePlus className="size-8 text-slate-400" />
          ) : (
            <RxUpload className="size-8 text-slate-400" />
          )}
          <p className="mt-2 text-sm text-slate-500">
            Drop your banner image here or click to upload
          </p>
          <p className="text-xs text-slate-400">Maximum size {maxSizeMB} MB</p>
        </div>
      )}
      <Input
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleInputChange}
        type="file"
        disabled={disabled || uploading}
      />
      {!preview && (
        <div
          className="absolute top-0 right-0 bottom-0 left-0 cursor-pointer"
          onClick={handleClick}
        />
      )}
    </div>
  );

  return (
    <>
      {variant === 'avatar' && renderAvatar()}
      {variant === 'default' && renderDefault()}
      {variant === 'banner' && renderBanner()}

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
              maxImageSize={MAX_FILE_SIZE}
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
}
