// import { type GrantApplication } from '@prisma/client';
// import axios from 'axios';

// import { airtableConfig, airtableUpsert, airtableUrl } from '@/utils/airtable';

// interface GrantApplicationWithUserAndGrant extends GrantApplication {
//   grant: {
//     airtableId: string | null;
//   };
//   user: {
//     email: string;
//   };
// }

// interface RecipientAirtableSchema {
//   earnApplicationId: string;
//   Name: string;
//   Applicants: string[];
//   Grant: string[];
//   // Type: string;
//   'Email ID': string;
//   Amount: number;
//   Deadline: string;
//   // 'Date of Birth': string;
//   // Address: string;
//   // Country: string;
//   // 'ID Type': string;
//   // 'ID Number': string;
//   // 'ID Photos': string[];
// }

// export function grantTranchePaymentToAirtable(
//   grantApplication: GrantApplicationWithUserAndGrant,
// ): RecipientAirtableSchema {
//   return {
//     earnApplicationId: grantApplication.id,
//     Name: `${grantApplication.kycName}`,
//     Applicants: [applicantRecordId],
//     Grant: [grantApplication.grant.airtableId!],
//     'Email ID': grantApplication.user.email,
//     Amount: grantApplication.approvedAmount,
//     Deadline: grantApplication.projectTimeline,
//   };
// }

// export async function addOnboardingInfoToAirtable(
//   application: GrantApplicationWithUserAndGrant,
// ) {
//   const grantsAirtableConfig = airtableConfig(
//     process.env.AIRTABLE_GRANTS_API_TOKEN!,
//   );
//   const paymentsAirtableURL = airtableUrl(
//     process.env.AIRTABLE_GRANTS_BASE_ID!,
//     process.env.AIRTABLE_PAYMENTS_TABLE_NAME!,
//   );

//   const airtableData =    (application);
//   const airtablePayload = airtableUpsert('earnApplicationId', [
//     { fields: airtableData },
//   ]);

//   await axios.patch(
//     paymentsAirtableURL,
//     JSON.stringify(airtablePayload),
//     grantsAirtableConfig,
//   );
// }
