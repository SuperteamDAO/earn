import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const createOTP = async (email: string, name: string) => {
  try {
    const { data } = await axios.post(`${BACKEND_URL}/email/otp`, {
      email,
      name,
    });

    return data;
  } catch (error) {
    console.log(error);

    return null;
  }
};

export const verifyOTP = async (id: string, email: string, otp: string) => {
  try {
    const { data } = await axios.post(`${BACKEND_URL}/email/otp/verify`, {
      id,
      email,
      otp,
    });

    return data;
  } catch (error) {
    console.log(error);

    return null;
  }
};

export const WelcomeSponsor = async (email: string, name: string) => {
  try {
    const { data } = await axios.post(`${BACKEND_URL}/email/sponsor/welcome`, {
      email,
      name,
    });

    return data;
  } catch (error) {
    console.log(error);

    return null;
  }
};
export const WelcomeTalent = async (email: string, name: string) => {
  try {
    const { data } = await axios.post(`${BACKEND_URL}/email/talent/welcome`, {
      email,
      name,
    });

    return data;
  } catch (error) {
    console.log(error);

    return null;
  }
};
