import 'server-only';

import * as Effect from 'effect/Effect';

import type { ChapterRegionData } from '@/interface/chapter';
import * as Database from '@/server/database';

// Earn's active chapters as the region helpers in
// src/features/listings/utils/region.ts take them (Earn's getChapterRegions).
export const chapterRegions = (
  database: Database.Database['Service'],
): Effect.Effect<Array<ChapterRegionData>, Database.DatabaseError> =>
  database
    .query('chapterRegions', (client) =>
      client.chapter.findMany({
        where: { active: true },
        select: {
          id: true,
          name: true,
          region: true,
          displayValue: true,
          slug: true,
          code: true,
          countries: true,
          banner: true,
          icons: true,
          link: true,
          hello: true,
          nationality: true,
        },
      }),
    )
    .pipe(
      Effect.map((chapters) =>
        chapters.map((chapter) => ({
          id: chapter.id,
          name: chapter.name,
          region: chapter.region,
          displayValue: chapter.displayValue || chapter.region,
          slug: chapter.slug,
          code: chapter.code || '',
          country: Array.isArray(chapter.countries)
            ? chapter.countries.filter(
                (country): country is string => typeof country === 'string',
              )
            : [],
          banner: chapter.banner,
          icons: chapter.icons,
          link: chapter.link,
          hello: chapter.hello,
          nationality: chapter.nationality,
        })),
      ),
    );

const normalize = (value: string | null | undefined) =>
  (value || '').trim().toLowerCase();

// The chapter region someone's location falls in, or Global (Earn's
// getRegionNameForLocation).
export function regionForLocation(
  location: string | null | undefined,
  chapters: ReadonlyArray<ChapterRegionData>,
): string {
  const wanted = normalize(location);
  if (!wanted) return 'Global';
  const chapter = chapters.find(
    (chapter) =>
      normalize(chapter.region) === wanted ||
      normalize(chapter.displayValue) === wanted ||
      normalize(chapter.name) === wanted ||
      chapter.country.some((country) => normalize(country) === wanted),
  );
  return chapter?.region || 'Global';
}
