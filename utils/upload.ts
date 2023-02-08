import axios from 'axios';

export async function uploadToCloudinary(image: any) {
  const formData = new FormData();

  formData.append('file', image);
  formData.append('upload_preset', 'dcudj36w');
  let post = await axios.post(
    'https://api.cloudinary.com/v1_1/dgvnuwspr/image/upload',
    formData
  );
  return post.data.secure_url;
}
