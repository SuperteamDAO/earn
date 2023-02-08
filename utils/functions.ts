import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { SponsorType } from '../interface/sponsor';
import { SponsorStore } from '../store/sponsor';

let Backend_Url = 'http://localhost:3001/api/v1';
if (process.env.NODE_ENV === 'production') {
  Backend_Url = '';
}

export const createUser = async (publickey: string) => {
  const id = uuidV4();
  try {
    const res = await axios.post(`${Backend_Url}/user/create`, {
      id: id,
      publickey,
    });
    return res.data;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const genrateOtp = async (publicKey: string) => {
  try {
    const res = await axios.post(`${Backend_Url}/email/totp`, {
      publicKey,
    });
    return res.headers.get;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const createSponsor = async (sponsor: SponsorType) => {
  try {
    const res = await axios.post(`${Backend_Url}/sponsor/create`, {
      ...sponsor,
    });
    return res.data;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const findSponsors = async (publicKey: string) => {
  if (!publicKey) return null;
  try {
    const { data } = await axios.get(
      `${Backend_Url}/sponsor/find?publickey=${publicKey}`
    );
    SponsorStore.setState({
      currentSponsor: data.data[0],
    });
    return data.data ?? [];
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const findTeam = async (id: string) => {
  if (!id) return null;
  try {
    const { data } = await axios.get(`${Backend_Url}/sponsor/team?id=${id}`);

    return data.data ?? [];
  } catch (error) {
    console.log(error);
    return null;
  }
};
