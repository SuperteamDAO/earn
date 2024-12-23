export function roundToNearestThousand(number: number): number {
  return Math.round(number / 1000) * 1000;
}
