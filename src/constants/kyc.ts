export const KYC_LINK = 'https://in.sumsub.com/websdk/p/uni_bnsxQgyYOyO03A1E';
export const KYB_LINK =
  'https://airtable.com/appc0ZVhbKj8hMLvH/pag1basnUtkXynozF/form';
export const KYC_SPONSOR_WHITELIST = (
  process.env.NEXT_PUBLIC_KYC_SPONSORS || ''
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
