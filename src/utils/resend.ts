import { Resend } from 'resend';

const resendMail = new Resend(process.env.RESEND_API_KEY);

export default resendMail;
