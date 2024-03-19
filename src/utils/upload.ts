import axios from 'axios';

export async function uploadToCloudinary(image: any) {
  const formData = new FormData();

  formData.append('file', image);
  formData.append(
    'upload_preset',
    process.env.NEXT_PUBLIC_CLOUDINARY as string,
  );
  // if(name) {
  //   // this can act as file path as well.
  //   // can have extension e.g .png .jpg or not, would still work
  //   // without extension
  //   // url should not start in '/' nor should it end in '/'
  //   if(name[0] === "/") {
  //     name = name.substring(1);
  //   }
  //   if(name[name.length - 1] === "/") {
  //     name = name.substring(0, name.length - 1);
  //   }
  //   formData.append('public_id', name);
  // }
  const post = await axios.post(
    `https://api.cloudinary.com/v1_1/dgvnuwspr/image/upload`,
    formData,
  );
  return post.data.secure_url as string;
}
