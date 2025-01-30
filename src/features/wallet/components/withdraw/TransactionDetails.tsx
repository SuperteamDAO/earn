import { ArrowUpRight } from 'lucide-react';

import { tokenList } from '@/constants/tokenList';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

interface TransactionDetailsProps {
  recipient: string;
  amount: string;
  tokenAddress: string;
  txId: string;
}

export const TransactionDetails = ({
  recipient,
  amount,
  tokenAddress,
  txId,
}: TransactionDetailsProps) => {
  const tokenImg = tokenList.find(
    (token) => token.mintAddress === tokenAddress,
  )?.icon;

  const tokenSymbol = tokenList.find(
    (token) => token.mintAddress === tokenAddress,
  )?.tokenSymbol;

  return (
    <div className="flex flex-col items-center space-y-8 py-4">
      <div className="rounded-full bg-blue-50 p-6">
        <div className="relative">
          <span className="flex items-center justify-center rounded-full bg-blue-500 text-2xl text-white">
            <img
              src={tokenImg}
              alt={tokenSymbol}
              className="h-12 w-12 rounded-full"
            />
          </span>
          <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L9 17L4 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>

      <div className="w-full space-y-4 font-medium tracking-tight">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Sent to</span>
          <span className="text-slate-600">
            {truncatePublicKey(recipient, 6)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Amount</span>
          <span className="text-slate-600">
            {amount} {tokenSymbol}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Time</span>
          <span className="text-slate-600">{new Date().toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Txn ID</span>
          <a
            href={`https://solscan.io/tx/${txId}`}
            className="text-slate-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {txId.slice(0, 8)}...{txId.slice(-8)}
          </a>
        </div>
      </div>

      <a
        href={`https://solscan.io/tx/${txId}`}
        className="w-full rounded-md border border-slate-400 py-3 text-center text-sm text-slate-500"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="flex items-center justify-center gap-2">
          View on Solscan
          <ArrowUpRight className="h-4 w-4" />
        </div>
      </a>
    </div>
  );
};
