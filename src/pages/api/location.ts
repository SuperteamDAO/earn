import type { NextApiRequest, NextApiResponse } from 'next';

type LocationResponse = Record<string, unknown> & {
  country_code?: string;
};

const IPAPI_BASE_URL = 'https://ipapi.co';
const LOCATION_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'superteam-earn-location',
};

const getVercelCountry = (req: NextApiRequest) => {
  const value = req.headers['x-vercel-ip-country'];
  const code = Array.isArray(value) ? value[0] : value;
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed || trimmed.toUpperCase() === 'XX') return null;
  return trimmed;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LocationResponse | { error: string }>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Cache-Control', 'private, max-age=300');

  const vercelCountry = getVercelCountry(req);
  if (vercelCountry) {
    return res.status(200).json({ country_code: vercelCountry });
  }

  try {
    const response = await fetch(`${IPAPI_BASE_URL}/json/`, {
      headers: LOCATION_HEADERS,
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Failed to fetch location' });
    }

    const data = (await response.json()) as LocationResponse;
    return res.status(200).json(data);
  } catch (error) {
    console.error('Location lookup failed', error);
    return res.status(502).json({ error: 'Failed to fetch location' });
  }
}
