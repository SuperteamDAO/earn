import axios from 'axios';

export async function uploadToCloudinary(image: any, uniqueId?: string) {
  const formData = new FormData();
  formData.append('file', image);
  formData.append(
    'upload_preset',
    process.env.NEXT_PUBLIC_CLOUDINARY as string,
  );
  if (uniqueId) {
    formData.append('public_id', uniqueId);
  }
  formData.append('quality', 'auto:good');

  const post = await axios.post(
    `https://api.cloudinary.com/v1_1/dgvnuwspr/image/upload`,
    formData,
  );
  formData.delete('file');
  return post.data.secure_url as string;
}
