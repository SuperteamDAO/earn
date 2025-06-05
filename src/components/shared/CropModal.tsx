import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CropModalProps {
  isOpen: boolean;
  imageFile: File;
  imageUrl: string;
  optimalDimensions: { width: number; height: number };
  variant: 'default' | 'short' | 'banner';
  onComplete: (croppedFile: File, croppedUrl: string) => void;
  onCancel: () => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: PixelCrop,
  fileName: string,
  fileType: string,
): Promise<{ file: File; url: string }> => {
  const image = new Image();
  image.src = imageSrc;

  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      console.log(pixelCrop);

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Could not create blob'));
            return;
          }

          const file = new File([blob], fileName, { type: fileType });
          const url = URL.createObjectURL(blob);
          resolve({ file, url });
        },
        fileType,
        0.9,
      );
    };

    image.onerror = () => reject(new Error('Could not load image'));
  });
};

export const CropModal = ({
  isOpen,
  imageFile,
  imageUrl,
  optimalDimensions,
  onComplete,
  onCancel,
}: CropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null,
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropComplete = useCallback(
    (_croppedArea: CropArea, croppedAreaPixels: PixelCrop) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCropImage = async () => {
    if (!croppedAreaPixels) {
      toast.error('Please select a crop area');
      return;
    }

    try {
      setIsProcessing(true);
      const { file, url } = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        imageFile.name,
        imageFile.type,
      );
      onComplete(file, url);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast.error('Failed to crop image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCrop = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
          <p className="text-sm text-slate-500">
            Drag the image to adjust the visible area. Only the part shown in
            the preview will be added.
          </p>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-96 w-full overflow-hidden rounded-lg bg-gray-100">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              cropSize={{
                width: optimalDimensions.width,
                height: optimalDimensions.height,
              }}
              objectFit="cover"
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { width: '100%', height: '100%' },
              }}
            />
          </div>

          <div className="w-full max-w-md space-y-2">
            <div className="flex items-center space-x-2">
              <span className="w-12 text-sm text-slate-600">Zoom:</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-12 text-sm text-slate-500">
                {zoom.toFixed(1)}x
              </span>
            </div>
          </div>

          <div className="text-center text-sm text-slate-500">
            Drag to reposition, use the zoom slider to adjust size. The crop
            area maintains the optimal aspect ratio.
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={resetCrop} disabled={isProcessing}>
            Reset
          </Button>
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleCropImage} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Apply Crop'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
