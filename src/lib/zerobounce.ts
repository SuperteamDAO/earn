import axios from 'axios';

/**
 * Validates an email address against ZeroBounce.
 * Throws on provider errors — callers decide whether to fail open or closed.
 * Never log the raw error from this call: the axios config contains the api key.
 */
export async function validateEmailWithZeroBounce(
  email: string,
): Promise<boolean> {
  const { data } = await axios.get('https://api.zerobounce.net/v2/validate', {
    params: {
      api_key: process.env.ZEROBOUNCE_API_KEY,
      email,
    },
    timeout: 10000,
  });

  const emailIsValid = data.status === 'valid';
  const isRoleBased =
    data.status === 'do_not_mail' && data.sub_status === 'role_based';

  return emailIsValid || isRoleBased;
}
