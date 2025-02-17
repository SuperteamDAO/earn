import { type FinalExecutionOutcome } from '@near-js/types';
import * as nearApi from 'near-api-js';

const jsonProviders = [
  new nearApi.providers.JsonRpcProvider(
    { url: 'https://archival-rpc.mainnet.near.org' }, // RPC URL
    {
      retries: 3, // Number of retries before giving up on a request
      backoff: 2, // Backoff factor for the retry delay
      wait: 200, // Wait time between retries in milliseconds
    }, // Retry options
  ),
];
const provider = new nearApi.providers.FailoverRpcProvider(jsonProviders);

const connectionConfig = {
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  provider,
};

export async function getTransactionStatus(
  accountId: string,
  transactionHash: string,
): Promise<FinalExecutionOutcome> {
  const api = await nearApi.connect(connectionConfig);

  const result = await api.connection.provider.txStatusReceipts(
    transactionHash,
    accountId,
    'FINAL',
  );

  return result;
}

export function formatTokenAmount(amount: string, decimals: number): string {
  const [wholePart, decimalPart = ''] = amount.split('.');
  const paddedDecimal = decimalPart.padEnd(decimals, '0');
  return `${wholePart}${paddedDecimal}`;
}
