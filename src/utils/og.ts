export const generateDynamicOg = (
  title: string,
  name: string,
  logo: string,
  total: number,
  skill: string
) => {
  console.log(title, name, logo, total, skill);

  // return '';
  const sposnorLogo = Buffer.from(logo).toString('base64');
  const bufferedTitle = Buffer.from(title).toString('base64');
  const ogAmount = Buffer.from(JSON.stringify(total)).toString('base64');
  const mainSkill = Buffer.from(skill).toString('base64');

  return `https://superteam-earn-og-production.up.railway.app/${bufferedTitle}/${ogAmount}/${mainSkill}/${name}/${sposnorLogo}`;
};
