import { airtableUrlMaker, type FetchAirtableProps } from './fetchAirtable';
import {
  type AIRTABLE_STATUS,
  type PIPELINE_STATUS,
  type STATUS,
  type SuperteamOption,
  type SYNC_SOURCE,
  type TSXTYPE,
} from './types';

export * from './actions';
export * from './consts';
export * from './fetchAirtable';
export * from './types';
export * from './updateAirtable';

export function tsxTypeToSyncSource(tsxType: TSXTYPE): SYNC_SOURCE {
  switch (tsxType) {
    case 'st-earn':
      return 'Earn All_Sync';
    case 'grants':
      return 'All Grants';
    case 'miscellaneous':
      return 'Misc Payments';
    default:
      return 'Misc Payments';
  }
}

export function syncSourceToTsxType(syncSource: SYNC_SOURCE): TSXTYPE {
  switch (syncSource) {
    case 'Earn All_Sync':
      return 'st-earn';
    case 'All Grants':
      return 'grants';
    case 'Misc Payments':
      return 'miscellaneous';
    default:
      return 'miscellaneous';
  }
}

export function airtableToStatus(
  airtableStatus: AIRTABLE_STATUS,
  pipelineStatus?: PIPELINE_STATUS,
): STATUS {
  if (pipelineStatus && pipelineStatus === 'Paid') {
    return 'paid';
  }
  switch (airtableStatus) {
    case 'Rejected':
      return 'rejected';
    case 'Undecided':
    case 'Applied':
      return 'undecided';
    case 'Accepted':
    case 'Verified':
    case 'Sent to pipeline':
      return 'accepted';
    default:
      return 'all';
  }
}

export function statusToAirtable(status: STATUS): AIRTABLE_STATUS[] {
  switch (status) {
    case 'rejected':
      return ['Rejected'];
    case 'undecided':
      return ['Applied', 'Undecided'];
    case 'accepted':
      return ['Accepted', 'Verified', 'Sent to pipeline'];
    default:
      return [];
  }
}

export function decideAirtableStatusFromType(
  type: TSXTYPE,
  status: STATUS,
): AIRTABLE_STATUS | undefined {
  switch (type) {
    case 'grants':
      return grantAirtableStatuses(status);
    case 'st-earn':
      return earnAirtableStatuses(status);
    case 'miscellaneous':
      return leadsAirtableStatuses(status);
    default:
      return undefined;
  }
}

export function earnStatusFromStatus(status: STATUS) {
  switch (status) {
    case 'accepted':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'undecided':
      return 'Pending';
    default:
      return undefined;
  }
}

function grantAirtableStatuses(status: STATUS): AIRTABLE_STATUS | undefined {
  switch (status) {
    case 'accepted':
      return 'Accepted';
    case 'rejected':
      return 'Rejected';
    case 'undecided':
      return 'Undecided';
    default:
      return undefined;
  }
}

function leadsAirtableStatuses(status: STATUS): AIRTABLE_STATUS | undefined {
  switch (status) {
    case 'accepted':
      return 'Verified';
    case 'rejected':
      return 'Rejected';
    case 'undecided':
      return 'Applied';
    default:
      return undefined;
  }
}

function earnAirtableStatuses(status: STATUS): AIRTABLE_STATUS | undefined {
  switch (status) {
    case 'accepted':
      return 'Verified';
    case 'rejected':
      return 'Rejected';
    case 'undecided':
      return 'Applied';
    default:
      return undefined;
  }
}

export function getFetchAirtableURL() {
  return airtableUrlMaker({
    fields: [
      'Purpose of Payment Main',
      'Submitter',
      'Status',
      'Amount',
      'Name',
      'SOL Wallet',
      'Discord Handle',
      'Application Time',
      'Sync Source',
      'KYC',
      'Contact Email',
      'Region',
      'RecordID',
      'earnApplicationId',
      'Payment Status',
      //records needed to show in details drawer
      'Title',
      'Summary',
      'Description',
      'Deadline',
      'Proof of Work',
      'Milestones',
      'KPI',
      'Telegram',
      'Category',
      'Approver',
    ],
    sortField: 'Application Time',
    sortDirection: 'desc',
  });
}

export function getFetchQueryProps(
  airtableUrl: URL,
  selectedSuperteam: SuperteamOption,
  q: string,
  status: STATUS,
  type: TSXTYPE,
  offset?: string,
): FetchAirtableProps {
  return {
    airtableUrl,
    pageSize: 5,
    region: selectedSuperteam.value,
    regionKey: 'Region',
    searchTerm: q,
    searchKey: 'Purpose of Payment Main',
    status,
    statusKey: 'Status',
    type,
    typeKey: 'Sync Source',
    offset,
  };
}
