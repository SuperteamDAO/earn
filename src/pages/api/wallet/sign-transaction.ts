import { Keypair, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { type NextApiRequest, type NextApiResponse } from 'next';

import { withAuth } from '@/features/auth/utils/withAuth';

function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { serializedTransaction } = req.body;

    const transaction = VersionedTransaction.deserialize(
      Buffer.from(serializedTransaction, 'base64'),
    );

    const feePayerWallet = Keypair.fromSecretKey(
      bs58.decode(process.env.FEEPAYER_PRIVATE_KEY as string),
    );

    transaction.sign([feePayerWallet]);

    const signedSerializedTransaction = Buffer.from(
      transaction.serialize(),
    ).toString('base64');

    res
      .status(200)
      .json({ serializedTransaction: signedSerializedTransaction });
  } catch (error) {
    console.error('Error signing transaction:', error);
    res.status(500).json({ error: 'Failed to sign transaction' });
  }
}

export default withAuth(handler);
