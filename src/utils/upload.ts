import axios from 'axios';

export async function uploadToCloudinary(image: any) {
  const formData = new FormData();

  formData.append('file', image);
  formData.append(
    'upload_preset',
    process.env.NEXT_PUBLIC_CLOUDINARY as string,
  );
  formData.append('quality', 'auto:good');
  formData.append('crop', 'limit');

  const post = await axios.post(
    `https://api.cloudinary.com/v1_1/dgvnuwspr/image/upload`,
    formData,
  );
  return post.data.secure_url as string;
}
