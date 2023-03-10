import { Talent } from './talent';

export interface Comments {
  id: string;
  message: string;
  talentId: string;
  timeStamp: string;
  refId: string;
  talent?: Talent;
}
