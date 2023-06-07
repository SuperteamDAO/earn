import client from '@sendgrid/client';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? '');
client.setApiKey(process.env.SENDGRID_API_KEY ?? '');

export { client };

export default sgMail;
