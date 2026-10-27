import { TokenIcon } from '@/components/ui/token-icon';

interface RequestedAmountRowProps {
  label: string;
  ask: number | undefined;
  token: string;
}

export const RequestedAmountRow = ({
  label,
  ask,
  token,
}: RequestedAmountRowProps) => (
  <div className="mb-6 flex items-center justify-between">
    <p className="text-slate-500">{label}</p>
    <div className="flex items-center">
      <TokenIcon
        className="h-5 w-5 rounded-full"
        alt={`${token} icon`}
        symbol={token}
      />
      <p className="ml-1 font-semibold text-slate-600">
        {ask} <span className="text-slate-400">{token}</span>
      </p>
    </div>
  </div>
);
