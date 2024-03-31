import { type BountyType } from '@prisma/client';
import axios from 'axios';

export const isSlugAvailable = async (
  slug: string,
  type: BountyType,
): Promise<boolean> => {
  try {
    const response = await axios.get(
      `/api/listings/slug?slug=${slug}&type=${type}`,
    );
    return response.data.isAvailable;
  } catch (error) {
    return false;
  }
};

// either resolves with true, or throws the validation error
export const isSlugValid = async (slug: string, type: BountyType) => {
  if (!/^[a-zA-Z0-9\-]+$/g.test(slug))
    return Promise.reject(
      'Only letters (a-z), numbers (0-9) and hyphens (-) are allowed.',
    );
  const available = await isSlugAvailable(slug, type);
  return available
    ? Promise.resolve(true)
    : Promise.reject('This slug is already taken');
};
