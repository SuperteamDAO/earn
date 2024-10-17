import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { styles } from '../utils';

interface TemplateProps {
  token: string;
}

export const OTPTemplate = ({ token }: TemplateProps) => {
  const { t } = useTranslation('common');

  return (
    <div style={styles.container}>
      <p style={styles.greetings}>{t('otpTemplate.greeting')}</p>
      <p style={styles.textWithMargin}>
        <Trans i18nKey="otpTemplate.otpMessage" values={token}>
          Your OTP for logging into Superteam Earn is <b>{token}</b>. This OTP
          is valid for 30 minutes.
        </Trans>
      </p>
      <p style={styles.salutation}>
        {t('otpTemplate.salutation')}
        <br />
        {t('otpTemplate.signature')}
      </p>
    </div>
  );
};
