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
