import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PDTG } from '@/constants';

import { styles } from '../utils';

export const WelcomeSponsorTemplate = () => {
  const { t } = useTranslation('common');

  return (
    <div style={styles.container}>
      <p style={styles.text}>{t('welcomeSponsorTemplate.welcome')}</p>
      <p style={styles.textWithMargin}>
        {t('welcomeSponsorTemplate.thankYou')}
      </p>
      <p style={styles.textWithMargin}>
        <Trans i18nKey="welcomeSponsorTemplate.helpMessage" ns="common">
          If you need any help related to setting up your listing on Earn,
          don&apos;t hesitate to get in touch with&nbsp;
          <a href={PDTG} style={styles.link}>
            {t('welcomeSponsorTemplate.contactName')}
          </a>
          &nbsp;{t('welcomeSponsorTemplate.onTelegram')}
        </Trans>
      </p>
      <p style={styles.salutation}>
        {t('welcomeSponsorTemplate.salutation')}
        <br />
        {t('welcomeSponsorTemplate.signature')}
      </p>
    </div>
  );
};
