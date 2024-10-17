import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { styles } from '../utils';

export const WelcomeTalentTemplate = () => {
  const { t } = useTranslation('common');

  return (
    <div style={styles.container}>
      <p style={styles.textWithMargin}>{t('welcomeTalentTemplate.greeting')}</p>
      <p style={styles.text}>{t('welcomeTalentTemplate.automatedEmail')}</p>
      <p style={styles.text}>{t('welcomeTalentTemplate.realPerson')}</p>
      <p style={styles.text}>
        <Trans i18nKey="welcomeTalentTemplate.introduction">
          I&apos;m Kash, and I&apos;m a Core Contributor over at{' '}
          <a href="https://superteam.fun" style={styles.link}>
            Superteam
          </a>
          . I might not know you personally yet, but I&apos;m pumped that
          you&apos;re here.
        </Trans>
      </p>
      <p style={styles.text}>{t('welcomeTalentTemplate.respectInbox')}</p>
      <p style={styles.text}>
        <strong>{t('welcomeTalentTemplate.favor')} </strong>
        {t('welcomeTalentTemplate.replyRequest')}
      </p>
      <p style={styles.text}>{t('welcomeTalentTemplate.learnMore')}</p>

      <p style={styles.salutation}>
        {t('welcomeTalentTemplate.salutation')} <br />
        {t('welcomeTalentTemplate.signature')}
      </p>
    </div>
  );
};
