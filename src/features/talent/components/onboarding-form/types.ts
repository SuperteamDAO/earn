import { type AboutYouFormData, type YourLinksFormData } from '../../schema';

export interface UserStoreType {
  emailVerified: boolean;
  form: AboutYouFormData & YourLinksFormData;
  updateState: (
    data: AboutYouFormData | YourLinksFormData | { email: string },
  ) => void;
}
