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

async function prepareProposal(
  description: string,
  token: Token,
  receiver: string,
  amount: number,
) {
  const amountFormatted = formatTokenAmount(amount.toString(), token.decimals);
  const functionCallArgs = async () => {
    if (token.tokenSymbol === 'NEAR') {
      return {
        kind: {
          Transfer: {
            token_id: '',
            receiver_id: receiver,
            amount: amountFormatted,
          },
        },
      };
    } else {
      const calls = [];
      if (!(await getStorageBalance(token.mintAddress, receiver))) {
        calls.push({
          args: Buffer.from(
            JSON.stringify({
              account_id: receiver,
              registration_only: true,
            }),
          ).toString('base64'),
          deposit: (BigInt(125) * BigInt(10) ** BigInt(21)).toString(),
          gas: BigInt(100000000000000).toString(),
          method_name: 'storage_deposit',
        });
      }
      calls.push({
        method_name: 'ft_transfer',
        deposit: '1',
        gas: BigInt(100000000000000).toString(),
        args: Buffer.from(
          JSON.stringify({
            receiver_id: receiver,
            amount: amountFormatted,
          }),
        ).toString('base64'),
      });
      return {
        kind: {
          FunctionCall: {
            actions: calls,
            receiver_id: token.mintAddress,
          },
        },
      };
    }
  };

  return {
    proposal: {
      description,

      ...(await functionCallArgs()),
    },
  };
}

export async function createSputnikProposal(
  dao: string,
  description: string,
  token: Token,
  receiver: string,
  amount: number,
) {
  const proposal = await prepareProposal(description, token, receiver, amount);
  const account = await near.account(NEAR_ACCOUNT);

  const daoPolicy: { proposal_bond: string | undefined } =
    await account.viewFunction({
      contractId: dao,
      methodName: 'get_policy',
    });

  const call = {
    contractId: dao,
    methodName: 'add_proposal',
    args: proposal,
    gas: BigInt(300000000000000),
    attachedDeposit: BigInt(daoPolicy.proposal_bond || 0),
  };

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
