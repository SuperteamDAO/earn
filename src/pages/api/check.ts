import Airtable from 'airtable';
import { type NextApiResponse } from 'next';

import { type NextApiRequestWithUser } from '@/features/auth';
import { prisma } from '@/prisma';
import { safeStringify } from '@/utils';

interface AirtableRecord {
  id: string;
  fields: {
    earnApplicationId: string;
    Status: string;
    Funding: number;
  };
}

interface AuditResult {
  missingInAirtable: string[];
  missingInDatabase: string[];
  statusMismatch: Array<{
    applicationId: string;
    dbStatus: string;
    airtableStatus: string;
    createdAt: Date;
    decidedAt: Date | null;
  }>;
  amountMismatch: Array<{
    applicationId: string;
    dbAmount: number | null;
    airtableAmount: number;
    createdAt: Date;
    decidedAt: Date | null;
  }>;
  totalDbRecords: number;
  totalAirtableRecords: number;
  matchingRecords: number;
  statusMismatchCount: number;
  amountMismatchCount: number;
}

async function convertAirtableStatus(airtableStatus: string): Promise<string> {
  switch (airtableStatus) {
    case 'Undecided':
      return 'Pending';
    case 'Accepted':
      return 'Approved';
    case 'Rejected':
      return 'Rejected';
    default:
      return airtableStatus;
  }
}

async function fetchAllAirtableRecords(): Promise<AirtableRecord[]> {
  return new Promise((resolve, reject) => {
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_GRANTS_API_TOKEN,
    }).base(process.env.AIRTABLE_GRANTS_BASE_ID!);
    const records: AirtableRecord[] = [];

    base(process.env.AIRTABLE_GRANTS_TABLE_NAME!)
      .select({
        pageSize: 100,
      })
      .eachPage(
        function page(partialRecords, fetchNextPage) {
          const formattedRecords = partialRecords.map((record) => ({
            id: record.id,
            fields: {
              earnApplicationId: record.get('earnApplicationId') as string,
              Status: record.get('Status') as string,
              Funding: record.get('Funding') as number,
            },
          }));

          records.push(...formattedRecords);
          console.log(
            `Fetched ${formattedRecords.length} records. Total so far: ${records.length}`,
          );

          fetchNextPage();
        },
        function done(err) {
          if (err) {
            console.error('Error fetching Airtable records:', err);
            reject(err);
            return;
          }

          console.log(`Finished fetching all ${records.length} records`);
          resolve(records);
        },
      );
  });
}

async function auditAirtableSync(
  _req: NextApiRequestWithUser,
  res: NextApiResponse,
) {
  try {
    const dbApplications = await prisma.grantApplication.findMany({
      where: {
        grant: {
          airtableId: {
            not: '',
          },
        },
      },
      include: {
        grant: {
          select: {
            airtableId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    console.log(
      `Found ${dbApplications.length} applications in database that should be synced with Airtable`,
    );

    const airtableRecords = await fetchAllAirtableRecords();

    console.log(`Found ${airtableRecords.length} total records in Airtable`);

    // Create maps for both DB and Airtable records for easier lookup
    const dbMap = new Map(dbApplications.map((app) => [app.id, app]));
    const airtableMap = new Map(
      airtableRecords.map((record) => [
        record.fields.earnApplicationId,
        record,
      ]),
    );

    const auditResult: AuditResult = {
      missingInAirtable: [],
      missingInDatabase: [],
      statusMismatch: [],
      amountMismatch: [],
      totalDbRecords: dbApplications.length,
      totalAirtableRecords: airtableRecords.length,
      matchingRecords: 0,
      statusMismatchCount: 0,
      amountMismatchCount: 0,
    };

    // Check for records missing in Airtable and status/amount mismatches
    for (const dbApp of dbApplications) {
      const airtableRecord = airtableMap.get(dbApp.id);

      if (!airtableRecord) {
        auditResult.missingInAirtable.push(dbApp.id);
        continue;
      }

      let hasStatusMismatch = false;
      let hasAmountMismatch = false;

      // Check status mismatch
      const expectedAirtableStatus = await convertAirtableStatus(
        airtableRecord.fields.Status,
      );

      if (
        !(
          airtableRecord.fields.Status === 'Accepted' &&
          (dbApp.applicationStatus === 'Approved' ||
            dbApp.applicationStatus === 'Completed')
        ) &&
        expectedAirtableStatus !== dbApp.applicationStatus
      ) {
        auditResult.statusMismatch.push({
          applicationId: dbApp.id,
          dbStatus: dbApp.applicationStatus,
          airtableStatus: airtableRecord.fields.Status,
          createdAt: dbApp.createdAt,
          decidedAt: dbApp.decidedAt,
        });
        hasStatusMismatch = true;
        auditResult.statusMismatchCount++;
      }

      // Check amount mismatch
      const dbAmount =
        dbApp.applicationStatus === 'Approved'
          ? dbApp.approvedAmount
          : dbApp.ask;
      const airtableAmount = airtableRecord.fields.Funding;

      if (dbAmount !== airtableAmount) {
        auditResult.amountMismatch.push({
          applicationId: dbApp.id,
          dbAmount: dbAmount,
          airtableAmount: airtableAmount,
          createdAt: dbApp.createdAt,
          decidedAt: dbApp.decidedAt,
        });
        hasAmountMismatch = true;
        auditResult.amountMismatchCount++;
      }

      // Only count as matching if there are no mismatches
      if (!hasStatusMismatch && !hasAmountMismatch) {
        auditResult.matchingRecords++;
      }
    }

    // Check for records missing in Database
    for (const airtableRecord of airtableRecords) {
      const earnApplicationId = airtableRecord.fields.earnApplicationId;
      if (earnApplicationId && !dbMap.has(earnApplicationId)) {
        auditResult.missingInDatabase.push(earnApplicationId);
      }
    }

    return res.status(200).json(auditResult);
  } catch (error: any) {
    console.log(`Error during Airtable sync audit: ${safeStringify(error)}`);

    return res.status(500).json({
      error: error.message,
      message: 'Unable to complete Airtable sync audit',
    });
  }
}

export default auditAirtableSync;
