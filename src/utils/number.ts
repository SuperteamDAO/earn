export function roundToNearestThousand(number: number): number {
  return Math.round(number / 1000) * 1000;
}
export function roundToNearestTenth(number: number): number {
  return Math.round(number / 10) * 10;
}
