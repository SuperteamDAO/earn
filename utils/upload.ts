import axios from 'axios';

export async function uploadToCloudinary(image: any) {
  const formData = new FormData();

  formData.append('file', image);
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDNARY as string);
  const post = await axios.post(
    `https://api.cloudinary.com/v1_1/dgvnuwspr/image/upload`,
    formData
  );
  return post.data.secure_url;
}
