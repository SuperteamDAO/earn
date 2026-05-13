const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const getGrantApprovedEmailBody = ({
  granteeName,
  grantTitle,
  projectTitle,
  approvedAmount,
  token,
  salutation,
}: {
  granteeName?: string | null;
  grantTitle?: string;
  projectTitle?: string | null;
  approvedAmount?: number;
  token: string;
  salutation?: string | null;
}) => {
  const greetingName = escapeHtml(granteeName?.trim() || 'there');
  const title = escapeHtml(grantTitle?.trim() || 'the grant');
  const applicationTitle = escapeHtml(projectTitle?.trim() || 'your project');
  const tokenText = escapeHtml(token);
  const amountText = approvedAmount
    ? ` for ${approvedAmount} ${tokenText}`
    : '';
  const signoff = escapeHtml(salutation?.trim() || 'Best, Superteam Earn');

  return `<p>Hi ${greetingName},</p><p></p>
<p>Your application to <strong>${title}</strong> for <strong>${applicationTitle}</strong> has been approved${amountText}. Congratulations!</p>
<p>Here are the next steps:</p>
<ul><li>Once you receive your first tranche and make significant progress on your project, share an update to claim your next tranche from the grant listing page.</li></ul>
<p><strong>Note:</strong> Payments for this grant will be made in USDG. If your wallet is not compatible with USDG, please reach out to us immediately. Once payments are sent for processing (on Monday noon UTC), we won't be able to update your wallet address.</p><p></p>
<p>${signoff}</p>`;
};

export const getGrantRejectedEmailBody = ({
  granteeName,
  grantTitle,
  projectTitle,
  salutation,
}: {
  granteeName?: string | null;
  grantTitle?: string;
  projectTitle?: string | null;
  salutation?: string | null;
}) => {
  const greetingName = escapeHtml(granteeName?.trim() || 'there');
  const title = escapeHtml(grantTitle?.trim() || 'the grant');
  const applicationTitle = escapeHtml(projectTitle?.trim() || 'your project');
  const signoff = escapeHtml(salutation?.trim() || 'Best, Superteam Earn');

  return `<p>Hey ${greetingName},</p><p></p>
<p>Unfortunately, your grant application for <strong>${applicationTitle}</strong> under <strong>${title}</strong> has been rejected. Please note that it is not possible for us or the sponsor to share individual feedback on your grant application.</p><p></p>
<p>We hope you continue adding to your proof of work by submitting to bounties and projects, and winning some along the way. All the best!</p><p></p>
<p>${signoff}</p>`;
};

export const getTrancheApprovedEmailBody = ({
  granteeName,
  projectTitle,
  sponsorName,
  approvedAmount,
  token,
  salutation,
}: {
  granteeName?: string | null;
  projectTitle?: string | null;
  sponsorName?: string | null;
  approvedAmount?: number;
  token: string;
  salutation?: string | null;
}) => {
  const greetingName = escapeHtml(granteeName?.trim() || 'there');
  const title = escapeHtml(projectTitle?.trim() || 'your project');
  const sponsor = escapeHtml(sponsorName?.trim() || 'the sponsor');
  const tokenText = escapeHtml(token);
  const amountText = approvedAmount
    ? ` for ${approvedAmount} ${tokenText}`
    : '';
  const signoff = escapeHtml(salutation?.trim() || 'Best, Superteam Earn');

  return `<p>Hi ${greetingName},</p><p></p>
<p>Your tranche request for <strong>${title}</strong> has been accepted by ${sponsor}${amountText}. Congratulations! You should receive your payment in a few days.</p><p></p>
<p><strong>Note:</strong> Payments for this grant will be made in USDG. If your wallet is not compatible with USDG, please reach out to us immediately. Once payments are sent for processing (on Monday noon UTC), we won't be able to update your wallet address.</p><p></p>
<p>${signoff}</p>`;
};

export const getTrancheRejectedEmailBody = ({
  granteeName,
  projectTitle,
  sponsorName,
  salutation,
}: {
  granteeName?: string | null;
  projectTitle?: string | null;
  sponsorName?: string | null;
  salutation?: string | null;
}) => {
  const greetingName = escapeHtml(granteeName?.trim() || 'there');
  const title = escapeHtml(projectTitle?.trim() || 'your project');
  const sponsor = escapeHtml(sponsorName?.trim() || 'the sponsor');
  const signoff = escapeHtml(salutation?.trim() || 'Best, Superteam Earn');

  return `<p>Hi ${greetingName},</p><p></p>
<p>Unfortunately, your tranche request for <strong>${title}</strong> has been rejected by ${sponsor}. Please get in touch with the sponsor directly to discuss further.</p><p></p>
<p>${signoff}</p>`;
};
