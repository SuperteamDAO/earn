const STANDALONE_HACKATHON_SLUGS = new Set(['next-stop-breakpoint']);

export function getHackathonPageHref(slug: string) {
  return STANDALONE_HACKATHON_SLUGS.has(slug)
    ? `/earn/${slug}`
    : `/earn/hackathon/${slug}`;
}
