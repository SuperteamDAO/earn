import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { styles } from '../utils';

interface TemplateProps {
  senderName: string;
  sponsorName: string;
  link: string;
}

export const InviteMemberTemplate = ({
  senderName,
  sponsorName,
  link,
}: TemplateProps) => {
  const { t } = useTranslation('common');

  return (
    <div style={styles.container}>
      <p style={styles.greetings}>{t('inviteMemberTemplate.greeting')}</p>
      <p style={styles.textWithMargin}>
        <Trans
          i18nKey="inviteMemberTemplate.inviteMessage"
          values={{ senderName, sponsorName }}
        >
          You have been invited by {senderName} to join{' '}
          <strong>{sponsorName}</strong> on Superteam Earn!
        </Trans>{' '}
        <a href={link} style={styles.link}>
          {t('inviteMemberTemplate.clickHere')}
        </a>{' '}
        {t('inviteMemberTemplate.acceptInvite')}
      </p>
      <p style={styles.salutation}>
        {t('inviteMemberTemplate.salutation')}
        <br />
        {t('inviteMemberTemplate.signature')}
      </p>
    </div>
  );
};
