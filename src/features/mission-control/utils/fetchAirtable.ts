import { PromiserJson } from '@/utils/promiser';

import {
  airtableToStatus,
  statusToAirtable,
  syncSourceToTsxType,
  tsxTypeToSyncSource,
} from '.';
import { type PaymentData, type STATUS, type TSXTYPE } from './types';

const airtableAPIUrl = `https://api.airtable.com/v0`;
const airtableUrlMaker = () => {
  const airtableUrl = new URL(
    `${airtableAPIUrl}/${process.env.AIRTABLE_MISSION_CONTROL_BASE}/${process.env.AIRTABLE_MISSION_CONTROL_TABLE}`,
  );

  airtableUrl.searchParams.append('fields[]', 'Purpose of Payment Main');
  airtableUrl.searchParams.append('fields[]', 'Submitter');
  airtableUrl.searchParams.append('fields[]', 'Status');
  airtableUrl.searchParams.append('fields[]', 'Amount');
  airtableUrl.searchParams.append('fields[]', 'Name');
  airtableUrl.searchParams.append('fields[]', 'SOL Wallet');
  airtableUrl.searchParams.append('fields[]', 'Discord Handle');
  airtableUrl.searchParams.append('fields[]', 'Application Time');
  airtableUrl.searchParams.append('fields[]', 'Sync Source');
  airtableUrl.searchParams.append('fields[]', 'KYC');
  airtableUrl.searchParams.append('fields[]', 'Contact Email');
  airtableUrl.searchParams.append('fields[]', 'Region');
  airtableUrl.searchParams.append('fields[]', 'RecordID');
  airtableUrl.searchParams.append('fields[]', 'earnApplicationId');
  airtableUrl.searchParams.append('sort[0][field]', 'Application Time');
  airtableUrl.searchParams.append('sort[0][direction]', 'desc');
  return airtableUrl;
};

interface FetchAirtableProps {
  customFilters?: string[];
  pageSize: number;
  id?: string;
  region?: string;
  regionKey?: string;
  status?: STATUS;
  statusKey?: string;
  type?: TSXTYPE;
  typeKey?: string;
  searchTerm?: string;
  searchKey?: string;
  offset?: string;
}

export async function fetchAirtable({
  customFilters = [],
  pageSize,
  id,
  region,
  regionKey,
  status,
  statusKey,
  type,
  typeKey,
  searchTerm,
  searchKey,
  offset,
}: FetchAirtableProps) {
  const airtableUrl = airtableUrlMaker();
  airtableUrl.searchParams.set('pageSize', pageSize + '');

  const filterFormulas: string[] = [...customFilters];

  if (id) {
    filterFormulas.push(`RECORD_ID()='${id}'`);
  }

  if (searchTerm && searchKey) {
    filterFormulas.push(`SEARCH("${searchTerm.toLowerCase()}", 
LOWER({${searchKey}}))`);
  }

  if (region && regionKey && region.toLowerCase() !== 'global') {
    filterFormulas.push(`SEARCH("${region.toLowerCase()}", 
LOWER({${regionKey}}))`);
  }

  if (status && statusKey && status !== 'all') {
    const statusValues = statusToAirtable(status);

    if (statusValues.length > 0) {
      const orConditions = statusValues.map(
        (statusValue) =>
          `SEARCH("${statusValue.toLowerCase()}", LOWER({${statusKey}}))`,
      );

      filterFormulas.push(`OR(${orConditions.join(', ')})`);
    }
  }

  if (type && typeKey && type !== 'all') {
    filterFormulas.push(`SEARCH("${tsxTypeToSyncSource(type).toLowerCase()}", 
LOWER({${typeKey}}))`);
  }

  if (filterFormulas.length > 0) {
    const combinedFilter =
      filterFormulas.length > 1
        ? `AND(${filterFormulas.join(',')})`
        : filterFormulas[0];
    if (combinedFilter) {
      airtableUrl.searchParams.append('filterByFormula', combinedFilter);
    }
  }

  if (offset) {
    airtableUrl.searchParams.append('offset', offset);
  }

  console.log(airtableUrl);

  const fetchReq = fetch(airtableUrl.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_MISSION_CONTROL_TOKEN}`,
    },
  });
  const [parsedData, fetchError] = await PromiserJson<any>(fetchReq);
  if (fetchError) {
    console.log(fetchError.error);
    throw new Error(
      fetchError.message ?? `Something went wrong whilte fetching Data`,
    );
  }

  const data: PaymentData[] = [];

  let currentData: any;
  for (let i = 0; i < parsedData.records.length; i++) {
    currentData = {
      ...parsedData.records[i].fields,
      id: parsedData.records[i].id,
    };
    console.log(currentData);
    data.push({
      id: currentData.id as string,
      type: syncSourceToTsxType(currentData['Sync Source']) || null,
      status: airtableToStatus(currentData['Status']) || null,
      title: currentData['Purpose of Payment Main'] || null,
      date: currentData['Application Time'] || null,
      name: currentData['Name'] || null,
      amount: currentData['Amount'] || null,
      email: currentData['Contact Email'] || null,
      tokenSymbol: 'USDC',
      kycLink: currentData['KYC']?.[0].url ?? null,
      discordId: currentData['Discord Handle'] || null,
      walletAddress: currentData['SOL Wallet'] || null,
      region: currentData['Region'] || null,
      recordId: currentData['RecordID'] || null,
      earnId: currentData['earnApplicationId'] || null,
    });
  }

  return {
    data,
    nextOffset: (parsedData.offset as string) || null,
  };
}
