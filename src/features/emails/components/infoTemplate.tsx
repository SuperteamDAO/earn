import React from 'react';

import { styles } from '../utils';

interface TemplateProps {
  info: {
    userSignUpsInLast7Days: number;
    totalUsersSignedUp: number;
    newTalentProfilesFilledInLast7Days: number;
    totalTalentProfilesFilled: number;
    newListingsPublishedInLast7Days: number;
    amountNewListingsPublishedInLast7Days: number | null;
    amountListingsOpenAndPublishedOverall: number | null;
    amountTVEAddedInLast7Days: number | null;
    totalTVE: number;
  };
}

export const InfoTemplate = ({ info }: TemplateProps) => {
  return (
    <div style={styles.container}>
      <p style={styles.greetings}>Weekly Stats</p>
      <p style={styles.textWithMargin}>
        Number of User Sign-ups in the Last 7 Days:{' '}
        {info.userSignUpsInLast7Days}
        total number of users signed up: {info?.totalUsersSignedUp}
        Number of New Talent Profiles Filled in the Last 7 Days :{' '}
        {info?.newTalentProfilesFilledInLast7Days}
        Total Number of Talent Profiles Filled :{' '}
        {info?.totalTalentProfilesFilled}
        Number of New Listings Published in the Last 7 Days:{' '}
        {info?.newListingsPublishedInLast7Days}
        Amount of New Listings Published in the Last 7 Days :{' '}
        {info?.amountNewListingsPublishedInLast7Days}
        Amount of Listings Open and Published Overall :{' '}
        {info?.amountListingsOpenAndPublishedOverall}
        Amount of TVE Added in the Last 7 Days :{' '}
        {info?.amountTVEAddedInLast7Days}
        Total TVE: {info?.totalTVE}
      </p>
      <p style={styles.salutation}>
        Best,
        <br />
        Superteam Earn
      </p>
    </div>
  );
};
