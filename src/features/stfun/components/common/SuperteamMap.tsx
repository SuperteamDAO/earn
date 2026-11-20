'use client';

import lookup from 'country-code-lookup';
import * as d3 from 'd3';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { ChapterRegionData } from '@/interface/chapter';

// Map from superteam code to ISO3 codes (for countries like Balkan that have multiple)
function getSuperteamCodeToIso3Map(
  chapters: ChapterRegionData[],
): Map<string, string[]> {
  const codeMap = new Map<string, string[]>();

  for (const st of chapters) {
    const iso3Codes: string[] = [];

    if (st.code === 'BALKAN') {
      for (const countryName of st.country) {
        const normalizedName = countryName
          .replace(/\s*\([^)]*\)\s*/g, '')
          .trim();

        const countryData =
          lookup.byCountry(normalizedName) || lookup.byCountry(countryName);
        if (countryData?.iso3) {
          iso3Codes.push(countryData.iso3);
        }
      }
    } else {
      const countryData = lookup.byIso(st.code);
      if (countryData?.iso3) {
        iso3Codes.push(countryData.iso3);
      }
    }

    codeMap.set(st.code, iso3Codes);
  }

  return codeMap;
}

// Reverse map: ISO3 code to superteam code
function getIso3ToSuperteamCodeMap(
  chapters: ChapterRegionData[],
): Map<string, string> {
  const reverseMap = new Map<string, string>();
  const codeMap = getSuperteamCodeToIso3Map(chapters);

  for (const [superteamCode, iso3Codes] of codeMap) {
    for (const iso3 of iso3Codes) {
      reverseMap.set(iso3, superteamCode);
    }
  }

  return reverseMap;
}

function getSuperteamAlpha3Codes(chapters: ChapterRegionData[]): string[] {
  const codeMap = getSuperteamCodeToIso3Map(chapters);
  const allCodes: string[] = [];

  for (const codes of codeMap.values()) {
    allCodes.push(...codes);
  }

  return [...new Set(allCodes)];
}

const MIN_COUNTRY_RENDER_SIZE_PX = 3;
const NORMALIZED_MARKER_RADIUS_PX = 1.2;
const COUNTRY_MARKER_OVERRIDES = new Map<string, readonly [number, number]>([
  ['SGP', [103.8198, 1.3521] as const],
]);

// Features in /api/geo/world.geojson are keyed by ISO3 code.
type CountryFeature = d3.ExtendedFeature & { id: string };
type WorldData = d3.ExtendedFeatureCollection<CountryFeature>;

// Countries too small to see get a dot instead: positioned from the country
// shape when the geojson has one, otherwise from a fixed coordinate.
type MarkerCandidate =
  | { iso3: string; feature: CountryFeature }
  | { iso3: string; coordinates: readonly [number, number] };
type PositionedMarker = MarkerCandidate & { position: [number, number] };

interface SuperteamMapProps {
  chapters: ChapterRegionData[];
  hoveredSuperteam: string | null;
  onHoverChange: (code: string | null) => void;
}

export default function SuperteamMap({
  chapters,
  hoveredSuperteam,
  onHoverChange,
}: SuperteamMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const superteamCodeMap = useMemo(
    () => getSuperteamCodeToIso3Map(chapters),
    [chapters],
  );
  const iso3ToSuperteamMap = useMemo(
    () => getIso3ToSuperteamCodeMap(chapters),
    [chapters],
  );

  const handleCountryHover = useCallback(
    (iso3Code: string | null) => {
      if (!iso3Code) {
        onHoverChange(null);
        return;
      }

      const superteamCode = iso3ToSuperteamMap.get(iso3Code);
      if (superteamCode) {
        onHoverChange(superteamCode);
      }
    },
    [iso3ToSuperteamMap, onHoverChange],
  );

  const handleCountryClick = useCallback(
    (iso3Code: string) => {
      const superteamCode = iso3ToSuperteamMap.get(iso3Code);
      if (!superteamCode) return;

      const superteam = chapters.find((st) => st.code === superteamCode);
      if (superteam?.link) {
        window.open(superteam.link, '_blank', 'noopener,noreferrer');
      }
    },
    [chapters, iso3ToSuperteamMap],
  );

  // Effect to update map colors when hoveredSuperteam changes
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const superteamCodes = getSuperteamAlpha3Codes(chapters);

    const defaultColor = '#1f1f1f';
    const highlightColor = '#5522DF';
    const hoverHighlightColor = '#F5A60B';
    const dimmedColor = '#3311AA';

    // Get the ISO3 codes for the hovered superteam
    const hoveredIso3Codes = hoveredSuperteam
      ? superteamCodeMap.get(hoveredSuperteam) || []
      : [];

    svg
      .selectAll<SVGPathElement, CountryFeature>('.countries path')
      .each(function (d) {
        const element = d3.select(this);
        const isSuperteam = superteamCodes.includes(d.id);
        const isHovered = hoveredIso3Codes.includes(d.id);

        if (hoveredSuperteam) {
          if (isHovered) {
            // Hovered country - brighter
            element
              .attr('fill', hoverHighlightColor)
              .attr('stroke', hoverHighlightColor)
              .attr('stroke-width', 1);
          } else if (isSuperteam) {
            // Other superteam countries - dimmed
            element
              .attr('fill', dimmedColor)
              .attr('stroke', dimmedColor)
              .attr('stroke-width', 0.5);
          } else {
            // Non-superteam countries - default
            element.attr('fill', defaultColor);
          }
        } else {
          // No hover - reset to default state
          if (isSuperteam) {
            element
              .attr('fill', highlightColor)
              .attr('stroke', highlightColor)
              .attr('stroke-width', 0.5);
          } else {
            element.attr('fill', defaultColor);
          }
        }
      });

    svg
      .selectAll<SVGCircleElement, PositionedMarker>('.country-markers circle')
      .each(function (d) {
        const element = d3.select(this);
        const isHovered = hoveredIso3Codes.includes(d.iso3);

        if (hoveredSuperteam) {
          if (isHovered) {
            element
              .attr('fill', hoverHighlightColor)
              .attr('stroke', hoverHighlightColor)
              .attr('stroke-width', 1);
          } else {
            element
              .attr('fill', dimmedColor)
              .attr('stroke', dimmedColor)
              .attr('stroke-width', 0.5);
          }
        } else {
          element
            .attr('fill', highlightColor)
            .attr('stroke', highlightColor)
            .attr('stroke-width', 0.5);
        }
      });
  }, [chapters, hoveredSuperteam, superteamCodeMap]);

  useEffect(() => {
    if (!containerRef.current) return;

    const superteamCodes = getSuperteamAlpha3Codes(chapters);

    const defaultColor = '#1f1f1f';
    const defaultStroke = '#2a2a2a';
    const highlightColor = '#5522DF';

    const aspectRatio = 1.8;
    let width = containerRef.current.clientWidth;
    let height = width / aspectRatio;

    const projection = d3.geoNaturalEarth1();
    const path = d3.geoPath().projection(projection);
    const getMarkerPosition = (
      marker: MarkerCandidate,
    ): [number, number] | null => {
      if ('feature' in marker) {
        const [cx, cy] = path.centroid(marker.feature);
        if (Number.isFinite(cx) && Number.isFinite(cy)) {
          return [cx, cy];
        }

        return null;
      }

      const projected = projection([...marker.coordinates]);
      if (
        projected &&
        Number.isFinite(projected[0]) &&
        Number.isFinite(projected[1])
      ) {
        return [projected[0], projected[1]];
      }

      return null;
    };

    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    svgRef.current = svg.node();

    const defs = svg.append('defs');

    // Grain filter for highlighted countries (visible texture, preserves color)
    const countryNoiseFilter = defs
      .append('filter')
      .attr('id', 'countryNoise')
      .attr('x', '0%')
      .attr('y', '0%')
      .attr('width', '100%')
      .attr('height', '100%');

    countryNoiseFilter
      .append('feTurbulence')
      .attr('type', 'fractalNoise')
      .attr('baseFrequency', '0.9')
      .attr('numOctaves', '4')
      .attr('stitchTiles', 'stitch')
      .attr('result', 'noise');

    // Convert noise to grayscale with reduced opacity
    countryNoiseFilter
      .append('feColorMatrix')
      .attr('type', 'matrix')
      .attr('values', '0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.15 0')
      .attr('result', 'subtleNoise');

    // Blend noise with original using multiply for subtle grain
    countryNoiseFilter
      .append('feBlend')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'subtleNoise')
      .attr('mode', 'overlay')
      .attr('result', 'blend');

    // Clip to original shape
    countryNoiseFilter
      .append('feComposite')
      .attr('in', 'blend')
      .attr('in2', 'SourceGraphic')
      .attr('operator', 'in');

    let resizeHandler: (() => void) | null = null;
    let worldData: WorldData | null = null;
    let markerGroup: d3.Selection<
      SVGGElement,
      unknown,
      null,
      undefined
    > | null = null;
    let normalizedMarkers: PositionedMarker[] = [];

    const initMap = async () => {
      const response = await fetch('/api/geo/world.geojson');
      const rawWorldData: WorldData = await response.json();

      // Filter out Antarctica
      const world: WorldData = {
        ...rawWorldData,
        features: rawWorldData.features.filter(
          (feature) => feature.id !== 'ATA' && feature.id !== 'AQ',
        ),
      };
      worldData = world;

      // Fit the entire globe to the viewport
      projection.fitSize([width, height], world);

      const featureById = new Map<string, CountryFeature>();
      for (const feature of world.features) {
        if (feature?.id) {
          featureById.set(feature.id, feature);
        }
      }

      const markerCandidates: MarkerCandidate[] = [];
      for (const iso3 of superteamCodes) {
        const feature = featureById.get(iso3);
        if (feature) {
          const [[x0, y0], [x1, y1]] = path.bounds(feature);
          const widthPx = x1 - x0;
          const heightPx = y1 - y0;

          if (
            widthPx <= MIN_COUNTRY_RENDER_SIZE_PX &&
            heightPx <= MIN_COUNTRY_RENDER_SIZE_PX
          ) {
            markerCandidates.push({ iso3, feature });
          }
        } else {
          const override = COUNTRY_MARKER_OVERRIDES.get(iso3);
          if (override) {
            markerCandidates.push({ iso3, coordinates: override });
          }
        }
      }

      normalizedMarkers = markerCandidates.flatMap((marker) => {
        const position = getMarkerPosition(marker);
        if (!position) {
          return [];
        }

        return [{ ...marker, position }];
      });

      // Countries group
      const countriesGroup = svg.append('g').attr('class', 'countries');

      countriesGroup
        .selectAll<SVGPathElement, CountryFeature>('path')
        .data(world.features)
        .enter()
        .append('path')
        .attr('d', (d) => path(d))
        .attr('fill', (d) =>
          superteamCodes.includes(d.id) ? highlightColor : defaultColor,
        )
        .attr('stroke', (d) =>
          superteamCodes.includes(d.id) ? highlightColor : defaultStroke,
        )
        .attr('stroke-width', (d) =>
          superteamCodes.includes(d.id) ? 0.5 : 0.25,
        )
        .attr('filter', (d) =>
          superteamCodes.includes(d.id) ? 'url(#countryNoise)' : 'none',
        )
        .style('cursor', (d) =>
          superteamCodes.includes(d.id) ? 'pointer' : 'default',
        )
        .style('transition', 'fill 0.2s ease, stroke 0.2s ease')
        .on('mouseenter', function (_event: MouseEvent, d) {
          if (superteamCodes.includes(d.id)) {
            handleCountryHover(d.id);
          }
        })
        .on('mouseleave', function () {
          handleCountryHover(null);
        })
        .on('click', function (_event: MouseEvent, d) {
          if (superteamCodes.includes(d.id)) {
            handleCountryClick(d.id);
          }
        });

      markerGroup = svg.append('g').attr('class', 'country-markers');
      markerGroup
        .selectAll<SVGCircleElement, PositionedMarker>('circle')
        .data(normalizedMarkers)
        .enter()
        .append('circle')
        .attr('data-iso3', (d) => d.iso3)
        .attr('r', NORMALIZED_MARKER_RADIUS_PX)
        .attr('cx', (d) => d.position[0])
        .attr('cy', (d) => d.position[1])
        .attr('fill', highlightColor)
        .attr('stroke', highlightColor)
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .style('transition', 'fill 0.2s ease, stroke 0.2s ease')
        .on('mouseenter', function (_event: MouseEvent, d) {
          handleCountryHover(d.iso3);
        })
        .on('mouseleave', function () {
          handleCountryHover(null);
        })
        .on('click', function (_event: MouseEvent, d) {
          handleCountryClick(d.iso3);
        });

      resizeHandler = () => {
        if (!containerRef.current || !worldData) return;
        width = containerRef.current.clientWidth;
        height = width / aspectRatio;

        // Fit the entire globe to the viewport on resize
        projection.fitSize([width, height], worldData);

        svg.attr('width', width).attr('height', height);
        svg
          .selectAll<SVGPathElement, CountryFeature>('.countries path')
          .attr('d', (d) => path(d));

        if (markerGroup) {
          markerGroup
            .selectAll<SVGCircleElement, PositionedMarker>('circle')
            .attr('cx', (d) => getMarkerPosition(d)?.[0] ?? 0)
            .attr('cy', (d) => getMarkerPosition(d)?.[1] ?? 0);
        }
      };

      window.addEventListener('resize', resizeHandler);
    };

    initMap();

    return () => {
      if (svgRef.current) {
        svgRef.current.remove();
      }
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
      }
    };
  }, [chapters, handleCountryHover, handleCountryClick]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label="World map highlighting Superteam locations across 20+ countries"
      className="relative -mt-6 flex w-full items-center justify-center overflow-hidden rounded-2xl border-[#3f3f3f]"
    />
  );
}
