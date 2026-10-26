// One of Earn's fallback OG images, at random: picked on the server, so
// the browser renders the same one.
export const randomFallbackImage = (random: number): string =>
  `/assets/fallback/resized-og/${Math.floor(random * 11) + 1}.webp`;
