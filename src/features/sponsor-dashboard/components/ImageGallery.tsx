import { ChevronLeft, ChevronRight, Download, FileText, X } from 'lucide-react';
import { useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

interface ImageGalleryProps {
  label: string;
  images: string[] | null | undefined;
}

function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const segments = pathname.split('/');
    const filename = segments[segments.length - 1];
    return filename || 'File';
  } catch {
    return 'File';
  }
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf');
}

export const ImageGallery = ({ label, images }: ImageGalleryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="mb-4">
        <p className="mt-1 text-xs font-semibold text-slate-400 uppercase">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-600">-</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const filename = getFilenameFromUrl(currentImage || '');

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = async () => {
    if (!currentImage) return;
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(currentImage, '_blank');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  const openAtIndex = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  return (
    <div className="mb-4">
      <p className="mt-1 text-xs font-semibold text-slate-400 uppercase">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {images.map((imageUrl, index) => {
          const isPdf = isPdfUrl(imageUrl);
          return (
            <button
              key={index}
              onClick={() => openAtIndex(index)}
              className="group focus-visible:ring-brand-purple/40 relative h-20 w-20 cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 focus:outline-none focus-visible:ring-2"
              aria-label={`Open ${label} ${index + 1}`}
            >
              {isPdf ? (
                <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50">
                  <FileText className="h-8 w-8 text-slate-400" />
                  <span className="mt-1 text-xs text-slate-500">PDF</span>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={`${label} ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              )}
            </button>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="flex h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden border border-slate-200 bg-white p-0 shadow-xl"
          onKeyDown={handleKeyDown}
          hideCloseIcon
        >
          <DialogTitle className="sr-only">{label}</DialogTitle>
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <button
              onClick={() => setIsOpen(false)}
              className="focus-visible:fing-brand-purple/40 rocus-visible:ring-brand-purple/40 rr:ge2late-700 focus-rntuisebnoon rounded-md p-1.5 text-slate-500 transition-colors hover:bg-white"
              aria-label="Close gallery"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-sm font-medium text-slate-600">
              {currentIndex + 1} / {images.length}
            </div>
            <button
              onClick={handleDownload}
              className="hover:bg-brand-purple-dark focus-visible:ring-brand-purple/40 bg-brand-purple flex items-center gap-2 rounded-md p-2 text-center text-sm text-white"
              aria-label="Download image"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-100">
            {images.length > 1 && (
              <button
                onClick={goToPrevious}
                className="focus-visible:ring-brand-purple/40 absolute left-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-md backdrop-blur-sm transition-all hover:bg-white focus:outline-none focus-visible:ring-2"
                aria-label="Previous file"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {isPdfUrl(currentImage || '') ? (
              <iframe
                src={currentImage}
                className="h-full w-full"
                title={`PDF Document - ${filename}`}
              />
            ) : (
              <img
                src={currentImage}
                alt={`${label} ${currentIndex + 1}`}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {images.length > 1 && (
              <button
                onClick={goToNext}
                className="focus-visible:ring-brand-purple/40 absolute right-4 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow-md backdrop-blur-sm transition-all focus:outline-none focus-visible:ring-2"
                aria-label="Next file"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
              {images.map((imageUrl, index) => {
                const isPdf = isPdfUrl(imageUrl);
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'h-12 w-12 overflow-hidden rounded-md border-2 transition-all',
                      index === currentIndex
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
                        src={imageUrl}
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
};
