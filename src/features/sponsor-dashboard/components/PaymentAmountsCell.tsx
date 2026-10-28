import { TableCell } from '@/components/ui/table';
import { TokenIcon } from '@/components/ui/token-icon';

interface PaymentAmountsCellProps {
  payments: Array<{ tranche: number; amount: number }>;
  token: string;
}

export const PaymentAmountsCell = ({
  payments,
  token,
}: PaymentAmountsCellProps) => (
  <TableCell>
    {payments.map((payment) => (
      <div
        className="my-2 flex items-center justify-between"
        key={payment.tranche}
      >
        <div className="flex items-center gap-1">
          <TokenIcon
            className="h-4 w-4 rounded-full"
            alt={`${token}`}
            symbol={token}
          />
          <p className="text-sm font-medium text-slate-700">
            {payment.amount} <span className="text-slate-400">{token}</span>
          </p>
        </div>
      </div>
    ))}
  </TableCell>
);
