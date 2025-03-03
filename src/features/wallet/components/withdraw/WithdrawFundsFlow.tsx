import { useWithdrawFlow } from '../../hooks/useWithdrawFlow';
import { type TokenAsset } from '../../types/TokenAsset';
import { type TxData } from '../../types/TxData';
import { type DrawerView } from '../WalletDrawer';
import { TransactionDetails } from './TransactionDetails';
import { WithdrawForm } from './WithdrawForm';

interface WithdrawFlowProps {
  tokens: TokenAsset[];
  view: DrawerView;
  setView: (view: DrawerView) => void;
  txData: TxData;
  setTxData: (txData: TxData) => void;
}

export function WithdrawFundsFlow({
  tokens,
  view,
  setView,
  txData,
  setTxData,
}: WithdrawFlowProps) {
  const { form, selectedToken, isProcessing, handleWithdraw } = useWithdrawFlow(
    {
      tokens,
      setView,
      setTxData,
    },
  );

  return (
    <div>
      {view === 'withdraw' && (
        <WithdrawForm
          form={form}
          selectedToken={selectedToken}
          onSubmit={handleWithdraw}
          tokens={tokens}
          isProcessing={isProcessing}
        />
      )}

      {view === 'success' && <TransactionDetails txData={txData} />}
      {view === 'history' && <TransactionDetails txData={txData} />}
    </div>
  );
}
