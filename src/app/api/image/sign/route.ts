import { v2 as cloudinary } from 'cloudinary';
import { cookies, headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

import { getPrivyToken } from '@/features/auth/utils/getPrivyToken';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const uploadSignatureSchema = z.object({
  folder: z
    .string()
    .min(1, 'Folder is required')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Folder must contain only alphanumeric characters, hyphens, and underscores',
    ),
  public_id: z
    .string()
    .optional()
    .refine(
      (publicId) => !publicId || /^[a-zA-Z0-9_-]+$/.test(publicId),
      'Public ID must contain only alphanumeric characters, hyphens, and underscores',
    ),
  resource_type: z.enum(['image', 'video', 'raw', 'auto'], {
    required_error: 'Resource type is required',
    invalid_type_error: 'Resource type must be one of: image, video, raw, auto',
  }),
  file_size: z.number().int().describe('File size in bytes'),
});

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');
    const cookieHeader = headersList.get('cookie');

    const req = {
      headers: { authorization: authHeader, cookie: cookieHeader },
      cookies: Object.fromEntries(
        (await cookies()).getAll().map((c) => [c.name, c.value]),
      ),
    };

    const privyDid = await getPrivyToken(req as any);

    if (!privyDid) {
      logger.warn(
        'Unauthorized upload signature request - no valid Privy token',
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.debug(`Authenticated Privy user: ${privyDid}`);

    const rawBody = await request.json();

    logger.debug(`Upload signature request: ${safeStringify(rawBody)}`);

    // Validate request body
    const validationResult = uploadSignatureSchema.safeParse(rawBody);
    if (!validationResult.success) {
      logger.warn(
        `Invalid request body: ${safeStringify(validationResult.error.format())}`,
      );
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: validationResult.error.format(),
        },
        { status: 400 },
      );
    }

    const body = validationResult.data;

    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!apiKey || !cloudName || !apiSecret) {
      logger.error('Cloudinary configuration missing');
      return NextResponse.json(
        { error: 'Cloudinary is not configured' },
        { status: 500 },
      );
    }

    const now = new Date();
    const timestamp = Math.round(now.getTime() / 1000);

    const paramsToSign: Record<string, string | number> = {};

    paramsToSign.folder = body.folder;
    paramsToSign.timestamp = timestamp;

    if (body.public_id) {
      paramsToSign.public_id = body.public_id;
    }

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    logger.info('Upload signature generated successfully');

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      folder: body.folder,
      publicId: body.public_id,
      resourceType: body.resource_type,
      fileSize: body.file_size,
    });
  } catch (error: any) {
    logger.error(
      `Failed to generate upload signature: ${safeStringify(error)}`,
    );
    return NextResponse.json(
      { error: `Failed to generate signature: ${error?.message || 'unknown'}` },
      { status: 500 },
    );
  }
}
