'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import RxUpload from '@/components/icons/RxUpload';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useImageUpload } from '@/hooks/use-image-upload';
import { type ImageSource, MAX_FILE_SIZE } from '@/lib/image-upload/client';
import { cn } from '@/utils/cn';

interface MultiImageUploaderProps {
  source: ImageSource;
  onChange: (urls: string[]) => void;
  value: string[];
  maxImages?: number;
  minImages?: number;
  label?: string;
  description?: string;
  disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function MultiImageUploader({
  source,
  onChange,
  value = [],
  maxImages = 10,
  minImages = 1,
  label,
  description,
  disabled = false,
}: MultiImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, uploading, progress, reset } = useImageUpload({
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

  const canAddMore = value.length < maxImages;

  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxImages - value.length;
      if (remainingSlots <= 0) return;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      let nextValue = [...value];

      for (const file of filesToProcess) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(
            `${file.name} is too large. Maximum size is ${maxSizeMB}MB`,
          );
          continue;
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(
            `${file.name} has unsupported format. Use JPEG, PNG, or WebP.`,
          );
          continue;
        }

        try {
          const result = await upload(file);
          nextValue = [...nextValue, result.secureUrl];
          onChange(nextValue);
        } catch {
          // Error is already handled by useImageUpload
        }
      }
      reset();
    },
    [maxImages, value, maxSizeMB, upload, onChange, reset],
  );

  const handleRemove = useCallback(
    (index: number) => {
      const newValue = value.filter((_, i) => i !== index);
      onChange(newValue);
    },
    [value, onChange],
  );

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

      if (disabled || uploading || !canAddMore) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileChange(files);
      }
    },
    [disabled, uploading, canAddMore, handleFileChange],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFileChange(e.target.files);
      e.target.value = '';
    },
    [handleFileChange],
  );

  const handleClick = useCallback(() => {
    if (!disabled && !uploading && canAddMore) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading, canAddMore]);

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div>
          <label className="text-sm font-medium text-slate-700">
            {label}
            {minImages > 0 && <span className="text-red-500">*</span>}
          </label>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {value.map((url, index) => (
          <div
            key={url}
            className="relative aspect-square overflow-hidden rounded-lg border border-slate-200"
          >
            <img
              src={url}
              alt={`Upload ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 rounded-full bg-white/90 p-1 shadow-sm hover:bg-white"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            )}
          </div>
        ))}

        {canAddMore && (
          <div
            className={cn(
              'relative aspect-square cursor-pointer rounded-lg border-2 border-dashed',
              isDragging
                ? 'border-brand-purple bg-slate-50'
                : 'border-slate-300',
              disabled && 'cursor-not-allowed opacity-50',
              uploading && 'cursor-wait',
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              {uploading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <Progress value={progress} className="h-1 w-12" />
                </>
              ) : isDragging ? (
                <ImagePlus className="h-6 w-6 text-slate-400" />
              ) : (
                <>
                  <RxUpload className="h-6 w-6 text-slate-400" />
                  <span className="text-xs text-slate-400">Add</span>
                </>
              )}
            </div>
            <Input
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleInputChange}
              type="file"
              multiple
              disabled={disabled || uploading}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {value.length}/{maxImages} images uploaded
        {minImages > 0 && ` (minimum ${minImages} required)`}
        {' • '}Maximum {maxSizeMB}MB per image
      </p>
    </div>
  );
}
