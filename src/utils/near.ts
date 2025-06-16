import * as nearApi from 'near-api-js';
import { Account, Near } from 'near-api-js';
import { type FinalExecutionOutcome } from 'near-api-js/lib/providers';
import { type ExecutionStatus } from 'near-api-js/lib/providers/provider';
import { type KeyPairString } from 'near-api-js/lib/utils';

import { type Token } from '@/constants/tokenList';

export const NEAR_ACCOUNT =
  process.env.NEXT_PUBLIC_NEAR_ACCOUNT || 'nearn-io.near';
export const NEAR_ACCOUNT_PRIVATE_KEY =
  process.env.NEAR_ACCOUNT_PRIVATE_KEY || '';
export const NEAR_SOCIAL_ACCOUNT = 'social.near';

const keyStore = new nearApi.keyStores.InMemoryKeyStore();
if (NEAR_ACCOUNT_PRIVATE_KEY !== '') {
  keyStore.setKey(
    'mainnet',
    NEAR_ACCOUNT,
    nearApi.KeyPair.fromString(NEAR_ACCOUNT_PRIVATE_KEY as KeyPairString),
  );
}

const jsonProviders = [
  new nearApi.providers.JsonRpcProvider(
    { url: 'https://free.rpc.fastnear.com' },
    {
      retries: 3,
      backoff: 2,
      wait: 200,
    },
  ),
];
const provider = new nearApi.providers.FailoverRpcProvider(jsonProviders);

const connectionConfig = {
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  provider,
  keyStore,
};

const near = new Near(connectionConfig);

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

export async function getTransactionDate(blockHash: string): Promise<Date> {
  const api = await nearApi.connect(connectionConfig);

  const result = await api.connection.provider.block({ blockId: blockHash });
  // timestamp is in nanoseconds, so we need to convert it to milliseconds
  return new Date(Number(result.header.timestamp) / 1_000_000);
}

export function formatTokenAmount(amount: string, decimals: number): string {
  const [wholePart, decimalPart = ''] = amount.split('.');
  const paddedDecimal = decimalPart.padEnd(decimals, '0');
  return `${wholePart}${paddedDecimal}`;
}

export async function getStorageBalance(
  tokenAddress: string,
  accountId: string,
) {
  const api = await nearApi.connect(connectionConfig);

  const account = new Account(api.connection, accountId);

  const result: { total: string; used: string } | null =
    await account.viewFunction({
      contractId: tokenAddress,
      methodName: 'storage_balance_of',
      args: {
        account_id: accountId,
      },
    });

  return result;
}

export async function createSputnikProposal(
  dao: string,
  description: string,
  token: Token,
  receiver: string,
  amount: number,
) {
  const amountFormatted = formatTokenAmount(amount.toString(), token.decimals);
  const args = {
    proposal: {
      description,
      kind: {
        Transfer: {
          token_id: token.tokenSymbol === 'NEAR' ? '' : token.mintAddress,
          receiver_id: receiver,
          amount: amountFormatted,
        },
      },
    },
  };

  const account = await near.account(NEAR_ACCOUNT);

  const daoPolicy: { proposal_bond: string | undefined } =
    await account.viewFunction({
      contractId: dao,
      methodName: 'get_policy',
    });

  const call = {
    contractId: dao,
    methodName: 'add_proposal',
    args,
    gas: BigInt(300000000000000),
    attachedDeposit: BigInt(daoPolicy.proposal_bond || 0),
  };

  if (
    token.tokenSymbol !== 'NEAR' &&
    !(await getStorageBalance(token.mintAddress, receiver))
  ) {
    const depositInYocto = BigInt(125) * BigInt(10) ** BigInt(21);

    // We need to run this prior to a proposal, so if we would hit nonce issue, on retry, it should work as we
    // have done that already...
    await account.functionCall({
      contractId: token.mintAddress,
      methodName: 'storage_deposit',
      args: {
        account_id: receiver,
        registration_only: true,
      },
      gas: BigInt(300000000000000),
      attachedDeposit: depositInYocto,
    });
  }

  // Let's sleep for 1 second to avoid nonce race condition
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const result = await account.functionCall(call);

  return getProposalId(result);
}

export async function getProposalId(result: FinalExecutionOutcome) {
  const base64 = (result.receipts_outcome[0]?.outcome.status as ExecutionStatus)
    .SuccessValue;
  const proposalId = Buffer.from(base64!, 'base64').toString('utf-8');
  return proposalId;
}

type DaoPolicy = {
  roles: {
    kind: { Everyone: unknown | undefined; Group: string[] | undefined };
    permissions: string[];
  }[];
};

export async function isNearnIoRequestor(dao: string) {
  const account = await near.account(NEAR_ACCOUNT);

  try {
    const daoPolicy: DaoPolicy = await account.viewFunction({
      contractId: dao,
      methodName: 'get_policy',
    });
    for (const role of daoPolicy.roles) {
      if (
        role.permissions.includes('*:AddProposal') ||
        role.permissions.includes('transfer:AddProposal')
      ) {
        const isGroupMember =
          role.kind.Group && role.kind.Group.includes(NEAR_ACCOUNT);
        return !!role.kind.Everyone || isGroupMember;
      }
    }
  } catch (error) {}

  return false;
}

export async function extractDaoFromTreasury(treasury: string) {
  const extractDaoIDSafely = (code: string) => {
    const directMatch = code.match(
      /const treasuryDaoID\s*=\s*["'`]([^"'`]+)["'`]/,
    );
    if (directMatch) return directMatch[1];

    return treasury.slice(0, -5) + '.sputnik-dao.near';
  };

  const account = await near.account(NEAR_SOCIAL_ACCOUNT);

  const data = await account.viewFunction({
    contractId: NEAR_SOCIAL_ACCOUNT,
    methodName: 'get',
    args: {
      keys: [`${treasury}/widget/config.data`],
    },
  });

  const config = data[treasury]?.widget['config.data'];

  if (!config) {
    return null;
  }

  return extractDaoIDSafely(config);
}

export async function getProposalStatus(dao: string, proposalId: number) {
  const account = await near.account(NEAR_ACCOUNT);

  const proposal = await account.viewFunction({
    contractId: dao,
    methodName: 'get_proposal',
    args: { id: Number(proposalId) },
  });

  return proposal.status;
}
