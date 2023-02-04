import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
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
