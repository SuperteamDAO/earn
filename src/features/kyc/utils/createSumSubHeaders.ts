import crypto from 'crypto';

const generateSignature = (
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
