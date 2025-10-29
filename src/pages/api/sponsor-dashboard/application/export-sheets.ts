import { drive } from '@googleapis/drive';
import { sheets } from '@googleapis/sheets';
import { OAuth2Client } from 'google-auth-library';
import type { NextApiResponse } from 'next';

import logger from '@/lib/logger';
import { prisma } from '@/prisma';
import { dayjs } from '@/utils/dayjs';
import { plainTextFromHtmlTurndown } from '@/utils/plainTextFromHtml';
import { safeStringify } from '@/utils/safeStringify';

import { type NextApiRequestWithSponsor } from '@/features/auth/types';
import { checkGrantSponsorAuth } from '@/features/auth/utils/checkGrantSponsorAuth';
import { withSponsorAuth } from '@/features/auth/utils/withSponsorAuth';

function getGoogleAuthClient() {
  const clientId = process.env.GA_LISTINGS_SHEET_CLIENT_ID;
  const clientSecret = process.env.GA_LISTINGS_SHEET_CLIENT_SECRET;
  const refreshToken = process.env.GA_LISTINGS_SHEET_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      'Missing required environment variables: GA_LISTINGS_SHEET_CLIENT_ID, GA_LISTINGS_SHEET_CLIENT_SECRET, or GA_LISTINGS_SHEET_REFRESH_TOKEN',
    );
  }

  logger.debug('Using OAuth2 authentication');

  const oauth2Client = new OAuth2Client(clientId, clientSecret);

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  return oauth2Client;
}

function jsonToSheetRows(data: any[]): string[][] {
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);

  const rows = [
    ['Please go to File -> Make a Copy to duplicate and edit this document'],
    [],
    headers,
    ...data.map((item) =>
      headers.map((header) => {
        const value = item[header];
        return value !== null && value !== undefined ? String(value) : '';
      }),
    ),
  ];

  return rows;
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function getSocialMediaLink(user: any): string {
  if (user.telegram) return user.telegram;
  if (user.twitter) return user.twitter;
  if (user.discord) return user.discord;
  return '';
}

async function handler(req: NextApiRequestWithSponsor, res: NextApiResponse) {
  const userId = req.userId;
  const userSponsorId = req.userSponsorId;

  logger.debug(`Request query: ${safeStringify(req.query)}`);

  const params = req.query;
  const grantId = params.grantId as string;

  logger.debug(
    `Google Sheets export request received - grantId: ${grantId}, userSponsorId: ${userSponsorId}`,
  );

  if (!grantId) {
    logger.error('Export request missing grantId parameter');
    return res.status(400).json({
      error: 'Missing required parameter: grantId',
    });
  }

  try {
    const { error, grant } = await checkGrantSponsorAuth(
      userSponsorId,
      grantId,
    );
    if (error) {
      return res.status(error.status).json({ error: error.message });
    }

    logger.debug(`Fetching applications for grant ID: ${grantId}`);

    const applications = await prisma.grantApplication.findMany({
      where: { grantId },
      include: { user: true },
      orderBy: [{ applicationStatus: 'asc' }, { createdAt: 'asc' }],
      take: 1000,
    });

    const grantQuestions = (grant.questions as { question: string }[]) || [];
    const questionSet = new Set(grantQuestions.map((q) => q.question));

    logger.debug('Transforming applications to JSON format for Sheets export');

    const finalJson = applications.map((application, i: number) => {
      const user = application.user;
      const applicationDate = dayjs(application.createdAt).format(
        'DD MMM YYYY',
      );
      const customGrantAnswers: { [key: string]: string } = {};
      questionSet.forEach((question) => {
        const answer = (application as any).answers?.find(
          (a: any) => a.question === question,
        );
        customGrantAnswers[question] = answer
          ? plainTextFromHtmlTurndown.turndown(answer.answer)
          : '';
      });
      return {
        'Sr no': i + 1,
        Name: `${user.firstName} ${user.lastName}`,
        'Email ID': user.email,
        'Profile Link': `https://earn.superteam.fun/t/${user.username}`,
        'User Wallet': user.walletAddress,
        'User Social Link': getSocialMediaLink(user),
        'Application Date': applicationDate,
        'Project Title': application?.projectTitle,
        'One Liner Description': application?.projectOneLiner,
        'Project Details': plainTextFromHtmlTurndown.turndown(
          application?.projectDetails,
        ),
        Deadline: application?.projectTimeline,
        'Proof of work': plainTextFromHtmlTurndown.turndown(
          application?.proofOfWork || '',
        ),
        'Goals and Milestones': plainTextFromHtmlTurndown.turndown(
          application?.milestones || '',
        ),
        'Primary KPI': plainTextFromHtmlTurndown.turndown(
          application?.kpi || '',
        ),
        ...customGrantAnswers,
        Ask: application.ask || '',
        'Approved Amount': application.approvedAmount,
        'Grant Decision': application.applicationStatus,
        Notes: plainTextFromHtmlTurndown.turndown(application.notes || ''),
      };
    });

    logger.debug('Initializing Google Sheets API client');

    const auth = getGoogleAuthClient();

    try {
      await auth.getAccessToken();
      logger.debug('Successfully authenticated with Google APIs');
    } catch (authError: any) {
      logger.error(`Authentication failed: ${authError.message}`);
      throw new Error(
        `Failed to authenticate with Google: ${authError.message}`,
      );
    }

    const sheetsClient = sheets({ version: 'v4', auth });
    const driveClient = drive({ version: 'v3', auth });

    const sheetTitle = `${grant.title || grantId} - Applications - ${dayjs().format('YYYY-MM-DD')}`;

    logger.debug(`Creating Google Sheet: ${sheetTitle}`);

    const parentFolderId = process.env.GA_LISTINGS_SHEET_PARENT_FOLDER_ID;

    const createResponse = await driveClient.files.create({
      requestBody: {
        name: sheetTitle,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: parentFolderId ? [parentFolderId] : undefined,
      },
      fields: 'id',
    });

    const spreadsheetId = createResponse.data.id;
    if (!spreadsheetId) {
      throw new Error('Failed to create spreadsheet - no ID returned');
    }

    logger.debug(`Spreadsheet created with ID: ${spreadsheetId}`);

    const rows = jsonToSheetRows(finalJson);

    logger.debug(`Writing ${rows.length} rows to spreadsheet`);

    if (rows.length > 0) {
      const MAX_ROWS_PER_UPDATE = 10000;
      if (rows.length <= MAX_ROWS_PER_UPDATE) {
        await sheetsClient.spreadsheets.values.update({
          spreadsheetId,
          range: 'Sheet1!A1',
          valueInputOption: 'RAW',
          requestBody: {
            values: rows,
          },
        });
      } else {
        const chunks = chunkArray(rows, MAX_ROWS_PER_UPDATE);
        let startRow = 1;
        for (const chunk of chunks) {
          await sheetsClient.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!A${startRow}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: chunk,
            },
          });
          startRow += chunk.length;
        }
      }
    }

    logger.debug('Formatting sheet with proper styling');

    await sheetsClient.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            mergeCells: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
                startColumnIndex: 0,
                endColumnIndex: 5,
              },
              mergeType: 'MERGE_ALL',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  textFormat: {
                    fontSize: 10,
                    bold: true,
                  },
                  wrapStrategy: 'WRAP',
                  verticalAlignment: 'MIDDLE',
                },
              },
              fields:
                'userEnteredFormat(textFormat,wrapStrategy,verticalAlignment)',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 2,
                endRowIndex: 3,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: {
                    red: 226 / 255,
                    green: 226 / 255,
                    blue: 226 / 255,
                  },
                  textFormat: {
                    bold: true,
                  },
                  wrapStrategy: 'WRAP',
                },
              },
              fields:
                'userEnteredFormat(backgroundColor,textFormat,wrapStrategy)',
            },
          },
          {
            updateDimensionProperties: {
              range: {
                sheetId: 0,
                dimension: 'ROWS',
                startIndex: 0,
                endIndex: 1,
              },
              properties: {
                pixelSize: 50,
              },
              fields: 'pixelSize',
            },
          },
          ...(() => {
            if (finalJson.length === 0) return [];

            const headers = Object.keys(finalJson[0] || {});
            const columnWidthRequests: any[] = [];

            headers.forEach((header, colIndex) => {
              const lengths: number[] = [];

              lengths.push(header.length);

              finalJson.forEach((row) => {
                const value = row[header as keyof typeof row];
                if (value !== null && value !== undefined) {
                  const stringValue = String(value);
                  lengths.push(stringValue.length);
                }
              });

              const avgLength =
                lengths.length > 0
                  ? lengths.reduce((sum, len) => sum + len, 0) / lengths.length
                  : 10;

              const minWidth = colIndex === 0 ? 60 : 100;
              const pixelWidth = Math.min(
                Math.max(Math.ceil(avgLength * 8 + 20), minWidth),
                400,
              );

              columnWidthRequests.push({
                updateDimensionProperties: {
                  range: {
                    sheetId: 0,
                    dimension: 'COLUMNS',
                    startIndex: colIndex,
                    endIndex: colIndex + 1,
                  },
                  properties: {
                    pixelSize: pixelWidth,
                  },
                  fields: 'pixelSize',
                },
              });
            });

            return columnWidthRequests;
          })(),
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startColumnIndex: 0,
                endColumnIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  horizontalAlignment: 'CENTER',
                },
              },
              fields: 'userEnteredFormat.horizontalAlignment',
            },
          },
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 3,
              },
              cell: {
                userEnteredFormat: {
                  wrapStrategy: 'WRAP',
                },
              },
              fields: 'userEnteredFormat.wrapStrategy',
            },
          },
        ],
      },
    });

    logger.debug('Setting public read permissions on spreadsheet');

    await driveClient.permissions.create({
      fileId: spreadsheetId,
      requestBody: {
        type: 'anyone',
        role: 'reader',
      },
    });

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    logger.info(`Google Sheets export successful for grant ID: ${grantId}`);

    return res.status(200).json({
      url: spreadsheetUrl,
    });
  } catch (error: any) {
    console.error(error);
    logger.error(
      `User ${userId} unable to export to Google Sheets: ${safeStringify(error)}`,
    );
    return res.status(400).json({
      error: error.message || error.toString(),
      message: `Error occurred while exporting applications to Google Sheets for grant=${grantId}.`,
    });
  }
}

export default withSponsorAuth(handler);
