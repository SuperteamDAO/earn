import { Webhook } from 'svix';

export const webhook = new Webhook(process.env.WEBHOOK_SECRET!);
