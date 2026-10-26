import type { ImageSource, UploadConfig } from './types';

// How the browser shrinks an image before uploading it. The folder and
// eager transformation are the server's (`src/server/image-store.ts`).
export const UPLOAD_CONFIGS: Record<ImageSource, UploadConfig> = {
  user: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 85,
  },
  sponsor: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 85,
  },
  description: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
  },
  'grant-event-pictures': {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
  },
  'grant-event-receipts': {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
  },
  'grant-agentic-receipts': {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 85,
  },
};
