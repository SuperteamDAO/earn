// import { Box, HStack, VStack } from '@chakra-ui/react';
// import { Regions } from '@prisma/client';
// import axios from 'axios';
// import { useAtom } from 'jotai';
// import type { GetServerSideProps } from 'next';
// import Head from 'next/head';
// import { useEffect, useState } from 'react';
// import { getURL } from '@/utils/validUrl';
// import { type Bounty } from '@/features/listings';
//
// interface BountyDetailsProps {
//   bounty: Bounty | null;
// }
//
// function WinnerBounty({ bounty: initialBounty }: BountyDetailsProps) {
//
// }
//
//
// export const getServerSideProps: GetServerSideProps = async (context) => {
//   const { slug, type } = context.query;
//
//   let bountyData;
//   try {
//     const bountyDetails = await axios.get(`${getURL()}api/bounties/${slug}`, {
//       params: { type },
//     });
//     bountyData = bountyDetails.data;
//   } catch (e) {
//     console.error(e);
//     bountyData = null;
//   }
//
//   return {
//     props: {
//       bounty: bountyData,
//     },
//   };
// };
//
// export default WinnerBounty;
