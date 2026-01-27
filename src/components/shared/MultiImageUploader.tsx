'use client';

import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ImagePlus,
  Loader2,
  X,
} from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

import RxUpload from '@/components/icons/RxUpload';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useImageUpload } from '@/hooks/use-image-upload';
import {
  type ImageSource,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_LARGE,
} from '@/lib/image-upload/client';
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
  allowPdf?: boolean;
  allowLargeFiles?: boolean;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PDF_TYPE = 'application/pdf';

export function MultiImageUploader({
  source,
  onChange,
  value = [],
  maxImages = 10,
  minImages = 1,
  label,
  description,
  disabled = false,
  allowPdf = false,
  allowLargeFiles = false,
}: MultiImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, uploading, progress, reset } = useImageUpload({
    source,
    allowPdf,
    allowLargeFiles,
    onError: (err) => {
      toast.error('Upload failed', {
        description: err.message,
      });
    },
  });

  const effectiveMaxSize = allowLargeFiles
    ? MAX_FILE_SIZE_LARGE
    : MAX_FILE_SIZE;
  const maxSizeMB = useMemo(
    () => Math.round(effectiveMaxSize / (1024 * 1024)),
    [effectiveMaxSize],
  );

  const allowedTypes = useMemo(() => {
    return allowPdf ? [...IMAGE_TYPES, PDF_TYPE] : IMAGE_TYPES;
  }, [allowPdf]);

  const canAddMore = value.length < maxImages;

  const handleFileChange = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const remainingSlots = maxImages - value.length;
      if (remainingSlots <= 0) return;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      let nextValue = [...value];

      for (const file of filesToProcess) {
        if (file.size > effectiveMaxSize) {
          toast.error(
            `${file.name} is too large. Maximum size is ${maxSizeMB}MB`,
          );
          continue;
        }

        if (!allowedTypes.includes(file.type)) {
          const formatList = allowPdf
            ? 'JPEG, PNG, WebP, or PDF'
            : 'JPEG, PNG, or WebP';
          toast.error(
            `${file.name} has unsupported format. Use ${formatList}.`,
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
    [
      maxImages,
      value,
      effectiveMaxSize,
      maxSizeMB,
      allowedTypes,
      allowPdf,
      upload,
      onChange,
      reset,
    ],
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

  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  }, []);

  const goToPrevious = useCallback(() => {
    setPreviewIndex((prev) => (prev === 0 ? value.length - 1 : prev - 1));
  }, [value.length]);

  const goToNext = useCallback(() => {
    setPreviewIndex((prev) => (prev === value.length - 1 ? 0 : prev + 1));
  }, [value.length]);

  const handlePreviewKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    },
    [goToPrevious, goToNext],
  );

  const currentPreviewUrl = value[previewIndex] || '';
  const isCurrentPreviewPdf = currentPreviewUrl.toLowerCase().endsWith('.pdf');

  const getFilenameFromUrl = (url: string): string => {
    try {
      const pathname = new URL(url).pathname;
      const segments = pathname.split('/');
      return segments[segments.length - 1] || 'File';
    } catch {
      return 'File';
    }
  };

  const handleDownload = async () => {
    if (!currentPreviewUrl) return;
    try {
      const response = await fetch(currentPreviewUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getFilenameFromUrl(currentPreviewUrl);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(currentPreviewUrl, '_blank');
    }
  };

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
        {value.map((url, index) => {
          const isPdf = url.toLowerCase().endsWith('.pdf');
          return (
            <div
              key={url}
              className="relative aspect-square overflow-hidden rounded-lg border border-slate-200"
            >
              <button
                type="button"
                onClick={() => openPreview(index)}
                className="h-full w-full cursor-pointer transition-opacity hover:opacity-90"
                aria-label={`Preview ${isPdf ? 'PDF' : 'image'} ${index + 1}`}
              >
                {isPdf ? (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50">
                    <FileText className="h-8 w-8 text-slate-400" />
                    <span className="mt-1 text-xs text-slate-500">PDF</span>
                  </div>
                ) : (
                  <img
                    src={url}
                    alt={`Upload ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
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
          );
        })}

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
              accept={
                allowPdf
                  ? 'image/jpeg, image/png, image/webp, application/pdf'
                  : 'image/jpeg, image/png, image/webp'
              }
              onChange={handleInputChange}
              type="file"
              multiple
              disabled={disabled || uploading}
            />
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400">
        {value.length}/{maxImages} {allowPdf ? 'files' : 'images'} uploaded
        {minImages > 0 && ` (minimum ${minImages} required)`}
        {' • '}Maximum {maxSizeMB}MB per {allowPdf ? 'file' : 'image'}
      </p>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent
          className="flex h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden border border-slate-200 bg-white p-0 shadow-xl"
          onKeyDown={handlePreviewKeyDown}
          hideCloseIcon
        >
          <DialogTitle className="sr-only">Preview</DialogTitle>
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="focus-visible:ring-brand-purple/40 rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-slate-700 focus:outline-none focus-visible:ring-2"
              aria-label="Close preview"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-sm font-medium text-slate-600">
              {previewIndex + 1} / {value.length}
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-brand-purple hover:bg-brand-purple-dark focus-visible:ring-brand-purple/40 flex items-center gap-2 rounded-md p-2 text-center text-sm text-white focus-visible:ring-2"
              aria-label="Download file"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-100">
            {value.length > 1 && (
              <button
                type="button"
                onClick={goToPrevious}
                className="focus-visible:ring-brand-purple/40 absolute left-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-md backdrop-blur-sm transition-all hover:bg-white focus:outline-none focus-visible:ring-2"
                aria-label="Previous file"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {isCurrentPreviewPdf ? (
              <iframe
                src={currentPreviewUrl}
                className="h-full w-full"
                title={`PDF Document - ${getFilenameFromUrl(currentPreviewUrl)}`}
              />
            ) : (
              <img
                src={currentPreviewUrl}
                alt={`Preview ${previewIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {value.length > 1 && (
              <button
                type="button"
                onClick={goToNext}
                className="focus-visible:ring-brand-purple/40 absolute right-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-md backdrop-blur-sm transition-all hover:bg-white focus:outline-none focus-visible:ring-2"
                aria-label="Next file"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {value.length > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              {value.map((url, index) => {
                const isPdf = url.toLowerCase().endsWith('.pdf');
                return (
                  <button
                    type="button"
                    key={url}
                    onClick={() => setPreviewIndex(index)}
                    className={cn(
                      'h-12 w-12 overflow-hidden rounded-md border-2 transition-all',
                      index === previewIndex
                        ? 'border-brand-purple ring-brand-purple/40 ring-2'
                        : 'border-transparent opacity-70 hover:opacity-100',
                    )}
                    aria-label={`View thumbnail ${index + 1}`}
                  >
                    {isPdf ? (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100">
                        <FileText className="h-6 w-6 text-slate-400" />
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt={`Thumbnail ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
