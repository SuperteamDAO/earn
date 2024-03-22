export function getBlobFromCanvas(
  canvas: HTMLCanvasElement,
  type: string,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Blob creation failed'));
      }
    }, type);
  });
}
