import axios from 'axios';
import * as crypto from 'crypto';

export interface SumSubBaseResponse {
  status?: string;
  reviewStatus?: string;
  applicantId?: string;
  token?: string;
}

export const SUMSUB_BASE_URL = 'https://api.sumsub.com';

export const generateSignature = (
  timestamp: number,
  method: string,
  url: string,
  body: string,
  secretKey: string,
): string => {
  const dataToSign = timestamp + method + url + body;
  return crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign)
    .digest('hex');
};

export const createSumSubHeaders = (
  method: string,
  url: string,
  body: string,
  secretKey: string,
  appToken: string,
) => {
  const ts = Math.floor(Date.now() / 1000);
  const signature = generateSignature(ts, method, url, body, secretKey);

  return {
    'Content-Type': 'application/json',
    'X-App-Token': appToken,
    'X-App-Access-Sig': signature,
    'X-App-Access-Ts': ts.toString(),
  };
};

export const handleSumSubError = (error: unknown): never => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    throw new Error('Invalid credentials');
  }
  throw new Error(
    error instanceof Error ? error.message : 'Failed to process SumSub request',
  );
};
