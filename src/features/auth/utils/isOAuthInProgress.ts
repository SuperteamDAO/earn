import { OAUTH_STORAGE_KEY } from '../constants/oauth';

export const isOAuthInProgress = () =>
  localStorage.getItem(OAUTH_STORAGE_KEY) === 'true';
