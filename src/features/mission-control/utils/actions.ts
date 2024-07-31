import axios from 'axios';

import { type STATUS, type TSXTYPE } from './types';

interface UpdateStatusParams {
  id: string;
  sourceId: string;
  type: TSXTYPE;
  status: STATUS;
  approvedAmount?: number;
  earnId?: string;
}

export const updateStatus = async ({
  id,
  sourceId,
  type,
  status,
  approvedAmount,
  earnId,
}: UpdateStatusParams) => {
  return await axios.post('/api/mission-control/update-status', {
    id,
    sourceId,
    type,
    status,
    approvedAmount,
    earnId,
  });
};

interface FetchTsxParams {
  status: STATUS;
  q: string;
  region?: string;
  type: TSXTYPE;
  offset: string;
}
export const fetchOffsetTransactions = async <T>({
  status,
  q,
  region,
  type,
  offset,
}: FetchTsxParams) => {
  return await axios.get<T>('/api/mission-control', {
    params: {
      status,
      q,
      region,
      type,
      offset,
    },
  });
};
