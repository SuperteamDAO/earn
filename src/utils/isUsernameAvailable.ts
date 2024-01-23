import axios from 'axios';

export const isUsernameAvailable = async (username: string) => {
  try {
    const response = await axios.get(`/api/user/username?username=${username}`);
    return response.data.available;
  } catch (error) {
    console.error(error);
    return false;
  }
};
