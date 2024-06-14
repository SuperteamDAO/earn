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
      <p
        style={{
          ...styles.greetings,
          fontSize: '16px',
          fontWeight: 500,
          textDecoration: 'underline',
        }}
      >
        Weekly Stats
      </p>
      <ul
        style={{ ...styles.textWithMargin, paddingLeft: '10px', margin: '0' }}
      >
        <li>
          Number of User Sign-ups in the Last 7 Days:{' '}
          {info.userSignUpsInLast7Days?.toLocaleString()}
        </li>
        <li>
          Total number of users signed up:{' '}
          {info?.totalUsersSignedUp?.toLocaleString()}
        </li>
        <li>
          Number of New Talent Profiles Filled in the Last 7 Days:{' '}
          {info?.newTalentProfilesFilledInLast7Days?.toLocaleString()}
        </li>
        <li>
          Total Number of Talent Profiles Filled:{' '}
          {info?.totalTalentProfilesFilled?.toLocaleString()}
        </li>
        <li>
          Number of New Listings Published in the Last 7 Days:{' '}
          {info?.newListingsPublishedInLast7Days?.toLocaleString()}
        </li>
        <li>
          Amount of New Listings Published in the Last 7 Days: $
          {info?.amountNewListingsPublishedInLast7Days?.toLocaleString()}
        </li>
        <li>
          Amount of Listings Open and Published Overall: $
          {info?.amountListingsOpenAndPublishedOverall?.toLocaleString()}
        </li>
        <li>
          Amount of TVE Added in the Last 7 Days: $
          {info?.amountTVEAddedInLast7Days?.toLocaleString()}
        </li>
        <li>Total TVE: ${info?.totalTVE?.toLocaleString()}</li>
      </ul>

      <p style={styles.salutation}>
        may your monday be good,
        <br />
        abhishek
      </p>
    </div>
  );
};
