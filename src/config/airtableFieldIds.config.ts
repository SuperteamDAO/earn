export interface RecipientAirtableFieldIds {
  NAME: string;
  APPLICANTS_LINK: string;
  GRANT_LINK: string;
  EMAIL_ID: string;
  AMOUNT: string;
  DEADLINE: string;
}

const developmentRecipientFieldIds: RecipientAirtableFieldIds = {
  NAME: 'fldDevNameXyz123',
  APPLICANTS_LINK: 'fldDevApplicantsAbc456',
  GRANT_LINK: 'fldDevGrantDef789',
  EMAIL_ID: 'fldDevEmailIdGhi012',
  AMOUNT: 'fldDevAmountJkl345',
  DEADLINE: 'fldDevDeadlineMno678',
};

const productionRecipientFieldIds: RecipientAirtableFieldIds = {
  NAME: 'fldProdNameAbc789',
  APPLICANTS_LINK: 'fldProdApplicantsDef012',
  GRANT_LINK: 'fldProdGrantGhi345',
  EMAIL_ID: 'fldProdEmailIdJkl678',
  AMOUNT: 'fldProdAmountMno901',
  DEADLINE: 'fldProdDeadlinePqr234',
};

export interface PaymentAirtableFieldIds {
  NAME: string;
  ADDRESS: string;
  DATE_OF_BIRTH: string;
  ID_NUMBER: string;
  ID_TYPE: string;
  COUNTRY_OF_RESIDENCE: string;
  AMOUNT: string;
  WALLET_ADDRESS: string;
  CATEGORY: string;
  PURPOSE_OF_PAYMENT: string;
  PROJECT_ARCHIVE: string;
  EMAIL: string;
  STATUS: string;
  REGION: string;
  APPROVER: string;
  EARN_APPLICATION_ID: string;
  EARN_TRANCHE_ID: string;
  DISCORD_EARN_USERNAME: string;
}

const developmentPaymentFieldIds: PaymentAirtableFieldIds = {
  NAME: 'fldDevPaymentName123',
  ADDRESS: 'fldDevAddress456',
  DATE_OF_BIRTH: 'fldDevDOB789',
  ID_NUMBER: 'fldDevIDNumber012',
  ID_TYPE: 'fldDevIDType345',
  COUNTRY_OF_RESIDENCE: 'fldDevCountry678',
  AMOUNT: 'fldDevPaymentAmount901',
  WALLET_ADDRESS: 'fldDevWallet234',
  CATEGORY: 'fldDevCategory567',
  PURPOSE_OF_PAYMENT: 'fldDevPurpose890',
  PROJECT_ARCHIVE: 'fldDevProject123',
  EMAIL: 'fldDevPaymentEmail456',
  STATUS: 'fldDevStatus789',
  REGION: 'fldDevRegion012',
  APPROVER: 'fldDevApprover345',
  EARN_APPLICATION_ID: 'fldDevAppId678',
  EARN_TRANCHE_ID: 'fldDevTrancheId901',
  DISCORD_EARN_USERNAME: 'fldDevUsername234',
};

const productionPaymentFieldIds: PaymentAirtableFieldIds = {
  NAME: 'fldProdPaymentName567',
  ADDRESS: 'fldProdAddress890',
  DATE_OF_BIRTH: 'fldProdDOB123',
  ID_NUMBER: 'fldProdIDNumber456',
  ID_TYPE: 'fldProdIDType789',
  COUNTRY_OF_RESIDENCE: 'fldProdCountry012',
  AMOUNT: 'fldProdPaymentAmount345',
  WALLET_ADDRESS: 'fldProdWallet678',
  CATEGORY: 'fldProdCategory901',
  PURPOSE_OF_PAYMENT: 'fldProdPurpose234',
  PROJECT_ARCHIVE: 'fldProdProject567',
  EMAIL: 'fldProdPaymentEmail890',
  STATUS: 'fldProdStatus123',
  REGION: 'fldProdRegion456',
  APPROVER: 'fldProdApprover789',
  EARN_APPLICATION_ID: 'fldProdAppId012',
  EARN_TRANCHE_ID: 'fldProdTrancheId345',
  DISCORD_EARN_USERNAME: 'fldProdUsername678',
};

// Field IDs for regions table
export interface RegionsAirtableFieldIds {
  NAME: string;
}

const developmentRegionsFieldIds: RegionsAirtableFieldIds = {
  NAME: 'fldDevRegionName123',
};

const productionRegionsFieldIds: RegionsAirtableFieldIds = {
  NAME: 'fldProdRegionName456',
};

// Field IDs for sponsors table
export interface SponsorsAirtableFieldIds {
  NAME: string;
}

const developmentSponsorsFieldIds: SponsorsAirtableFieldIds = {
  NAME: 'fldDevSponsorName123',
};

const productionSponsorsFieldIds: SponsorsAirtableFieldIds = {
  NAME: 'fldProdSponsorName456',
};

// Field IDs for grant applications table
export interface GrantApplicationAirtableFieldIds {
  EARN_APPLICATION_ID: string;
  TITLE: string;
  STATUS: string;
  SUMMARY: string;
  FUNDING: string;
  KPI: string;
  PROOF_OF_WORK: string;
  NAME: string;
  CONTACT_EMAIL: string;
  TWITTER_URL: string;
  SOL_WALLET: string;
  MILESTONES: string;
  GRANTS: string;
  DESCRIPTION: string;
  DISCORD_HANDLE: string;
  DEADLINE: string;
  TYPE: string;
  GRANT_LISTING_TITLE: string;
  REGION_DASHBOARD: string;
}

const developmentGrantApplicationFieldIds: GrantApplicationAirtableFieldIds = {
  EARN_APPLICATION_ID: 'fldDevGrantAppId123',
  TITLE: 'fldDevGrantTitle456',
  STATUS: 'fldDevGrantStatus789',
  SUMMARY: 'fldDevGrantSummary012',
  FUNDING: 'fldDevGrantFunding345',
  KPI: 'fldDevGrantKPI678',
  PROOF_OF_WORK: 'fldDevGrantProof901',
  NAME: 'fldDevGrantName234',
  CONTACT_EMAIL: 'fldDevGrantEmail567',
  TWITTER_URL: 'fldDevGrantTwitter890',
  SOL_WALLET: 'fldDevGrantWallet123',
  MILESTONES: 'fldDevGrantMilestones456',
  GRANTS: 'fldDevGrantsLink789',
  DESCRIPTION: 'fldDevGrantDesc012',
  DISCORD_HANDLE: 'fldDevGrantDiscord345',
  DEADLINE: 'fldDevGrantDeadline678',
  TYPE: 'fldDevGrantType901',
  GRANT_LISTING_TITLE: 'fldDevGrantListingTitle234',
  REGION_DASHBOARD: 'fldDevGrantRegion567',
};

const productionGrantApplicationFieldIds: GrantApplicationAirtableFieldIds = {
  EARN_APPLICATION_ID: 'fldProdGrantAppId890',
  TITLE: 'fldProdGrantTitle123',
  STATUS: 'fldProdGrantStatus456',
  SUMMARY: 'fldProdGrantSummary789',
  FUNDING: 'fldProdGrantFunding012',
  KPI: 'fldProdGrantKPI345',
  PROOF_OF_WORK: 'fldProdGrantProof678',
  NAME: 'fldProdGrantName901',
  CONTACT_EMAIL: 'fldProdGrantEmail234',
  TWITTER_URL: 'fldProdGrantTwitter567',
  SOL_WALLET: 'fldProdGrantWallet890',
  MILESTONES: 'fldProdGrantMilestones123',
  GRANTS: 'fldProdGrantsLink456',
  DESCRIPTION: 'fldProdGrantDesc789',
  DISCORD_HANDLE: 'fldProdGrantDiscord012',
  DEADLINE: 'fldProdGrantDeadline345',
  TYPE: 'fldProdGrantType678',
  GRANT_LISTING_TITLE: 'fldProdGrantListingTitle901',
  REGION_DASHBOARD: 'fldProdGrantRegion234',
};

const isProduction = process.env.NODE_ENV === 'production';

export const RECIPIENT_FIELD_IDS: RecipientAirtableFieldIds = isProduction
  ? productionRecipientFieldIds
  : developmentRecipientFieldIds;

export const PAYMENT_FIELD_IDS: PaymentAirtableFieldIds = isProduction
  ? productionPaymentFieldIds
  : developmentPaymentFieldIds;

export const REGIONS_FIELD_IDS: RegionsAirtableFieldIds = isProduction
  ? productionRegionsFieldIds
  : developmentRegionsFieldIds;

export const SPONSORS_FIELD_IDS: SponsorsAirtableFieldIds = isProduction
  ? productionSponsorsFieldIds
  : developmentSponsorsFieldIds;

export const GRANT_APPLICATION_FIELD_IDS: GrantApplicationAirtableFieldIds =
  isProduction
    ? productionGrantApplicationFieldIds
    : developmentGrantApplicationFieldIds;
