import axios from 'axios';

export async function uploadToCloudinary(image: any, path?: string) {
  const formData = new FormData();

  formData.append('file', image);
  formData.append(
    'upload_preset',
    process.env.NEXT_PUBLIC_CLOUDINARY as string,
  );
  if (path) {
    formData.append('folder', path);
  }
  const post = await axios.post(
    `https://api.cloudinary.com/v1_1/dgvnuwspr/image/upload`,
    formData,
  );
  return post.data.secure_url;
}
