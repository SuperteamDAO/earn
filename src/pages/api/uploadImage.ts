import { v2 as cloudinary } from 'cloudinary';
import { type NextApiRequest, type NextApiResponse } from 'next';
import sharp from 'sharp';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    try {
      const { imageBase64, type, folder } = req.body;
      const buffer = Buffer.from(imageBase64, 'base64');

      const processedImage = await sharp(buffer)
        .resize(type === 'pfp' ? 200 : undefined)
        .jpeg({ quality: 80 })
        .toBuffer();

      cloudinary.uploader
        .upload_stream({ resource_type: 'image', folder }, (error, result) => {
          if (error) {
            return res
              .status(500)
              .json({ error: 'Error uploading to Cloudinary', details: error });
          }
          if (result && result.secure_url) {
            return res
              .status(200)
              .json({ message: 'Upload successful', url: result.secure_url });
          } else {
            return res
              .status(500)
              .json({ error: 'Unexpected error with Cloudinary result' });
          }
        })
        .end(processedImage);
    } catch (error: any) {
      return res
        .status(500)
        .json({ error: 'Server error', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
