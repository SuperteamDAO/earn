import React from 'react';

import { CommentSponsorTemplate } from '@/components/emails/commentSponsorTemplate';

export default function email() {
  return (
    <CommentSponsorTemplate
      name={'hello'}
      bountyName="Dashboard Redesign"
      link="https://twitter.com"
    />
  );
}
