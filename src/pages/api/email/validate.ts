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
  // const isDev = process.env.VERCEL_ENV !== 'production';
  // if (isDev) {
  //   res.status(200).json({ isValid: true });
  // }

  try {
    if (process.env.ZEROBOUNCE_API_KEY) {
      const { data } = await axios.get(
        `https://api.zerobounce.net/v2/validate?api_key=${process.env.ZEROBOUNCE_API_KEY}&email=${email}`,
      );
      const emailIsValid = data.status === 'valid';
      const isRoleBased =
        data.status === 'do_not_mail' && data.sub_status === 'role_based';

      const isValid = emailIsValid || isRoleBased;

      return res.status(200).json({ isValid });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return res.status(200).json({ isValid: emailRegex.test(email) });
    }
  } catch (error) {
    console.error('Error validating email:', error);
    return res.status(500).json({ message: 'Error validating email' });
  }
}
