import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  // adding this to eliminate the need for OSS contributors to set up zerobounce themselves
  const isDev = process.env.VERCEL_ENV !== 'production';
  if (isDev) {
    res.status(200).json({ isValid: true });
  }

  try {
    const { data } = await axios.get(
      `https://api.zerobounce.net/v2/validate?api_key=${process.env.ZEROBOUNCE_API_KEY}&email=${email}`,
    );

    return res.status(200).json({ isValid: data.status === 'valid' });
  } catch (error) {
    console.error('Error validating email:', error);
    return res.status(500).json({ message: 'Error validating email' });
  }
}
