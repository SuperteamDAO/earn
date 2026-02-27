export interface ChapterDisplay {
  name: string;
  icons: string;
  banner: string;
  region: string;
  displayValue: string;
  country: string[];
  code: string;
  hello: string;
  nationality: string;
  people?: Array<{
    name: string;
    pfp: string;
    role?: string;
  }>;
  slug: string;
  link: string;
}

export interface ChapterRegionData {
  name: string;
  region: string;
  displayValue: string;
  slug: string;
  code: string;
  country: string[];
  icons?: string | null;
  banner?: string | null;
  link?: string | null;
  hello?: string | null;
  nationality?: string | null;
}
