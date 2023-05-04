import axios from 'axios';

export const isUsernameAvailable = async (username: string) => {
  try {
    const userDetails = await axios.post('/api/user', {
      username,
    });
    if (!userDetails?.data || !userDetails?.data?.id) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
