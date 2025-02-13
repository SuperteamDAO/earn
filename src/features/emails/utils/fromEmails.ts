import { CEO_NAME, PROJECT_NAME } from '@/constants/project';

export const replyToEmail = process.env.REPLY_TO_EMAIL;
export const ceoEmail = `${CEO_NAME} from ${PROJECT_NAME} <${process.env.CEO_EMAIL}>`;
