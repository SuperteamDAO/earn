import { Button, Container, Input, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

function Port() {
  const [userId, setUserId] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);
  const [sponsorsLoading, setSponsorsLoading] = useState(false);
  const [newSponsorsLoading, setNewSponsorsLoading] = useState(false);
  const [bountiesLoading, setBountiesLoading] = useState(false);
  const [grantsLoading, setGrantsLoading] = useState(false);
  const [totalLoading, setTotalLoading] = useState(false);
  const [jobsLoading, setJobsLoading] = useState(false);

  const portUsers = async () => {
    setUsersLoading(true);
    try {
      const usersData = await axios.post('/api/port/users');
      console.log('file: port.tsx:17 ~ portusersData ~ usersData:', usersData);
      setUsersLoading(false);
    } catch (e) {
      console.log('file: port.tsx:16 ~ portusersData ~ e:', e);
      setUsersLoading(false);
    }
  };

  const portSponsors = async () => {
    if (!userId) {
      // eslint-disable-next-line no-alert
      window.alert('Add User');
      return;
    }
    setSponsorsLoading(true);
    try {
      const sponsors = await axios.post('/api/port/sponsors', {
        userId,
      });
      console.log('file: port.tsx:17 ~ portSponsors ~ sponsors:', sponsors);
      setSponsorsLoading(false);
    } catch (e) {
      console.log('file: port.tsx:16 ~ portSponsors ~ e:', e);
      setSponsorsLoading(false);
    }
  };

  const portNewSponsors = async () => {
    if (!userId) {
      // eslint-disable-next-line no-alert
      window.alert('Add User');
      return;
    }
    setNewSponsorsLoading(true);
    try {
      const sponsors = await axios.post('/api/port/newSponsors', {
        userId,
      });
      console.log('file: port.tsx:17 ~ portSponsors ~ sponsors:', sponsors);
      setNewSponsorsLoading(false);
    } catch (e) {
      console.log('file: port.tsx:16 ~ portSponsors ~ e:', e);
      setNewSponsorsLoading(false);
    }
  };

  const portBounties = async () => {
    if (!userId) {
      // eslint-disable-next-line no-alert
      window.alert('Add User');
      return;
    }
    setBountiesLoading(true);
    try {
      const bounties = await axios.post('/api/port/bounties', {
        userId,
      });
      console.log('file: port.tsx:17 ~ portBounties ~ bounties:', bounties);
      setBountiesLoading(false);
    } catch (e) {
      console.log('file: port.tsx:16 ~ portBounties ~ e:', e);
      setBountiesLoading(false);
    }
  };

  const portGrants = async () => {
    if (!userId) {
      // eslint-disable-next-line no-alert
      window.alert('Add User');
      return;
    }
    setGrantsLoading(true);
    try {
      const grants = await axios.post('/api/port/grants', {
        userId,
      });
      console.log('file: port.tsx:17 ~ portGrants ~ grants:', grants);
      setGrantsLoading(false);
    } catch (e) {
      console.log('file: port.tsx:16 ~ portBounties ~ e:', e);
      setGrantsLoading(false);
    }
  };

  const portTotal = async () => {
    if (!userId) {
      // eslint-disable-next-line no-alert
      window.alert('Add User');
      return;
    }
    setTotalLoading(true);
    try {
      const totalData = await axios.post('/api/port/total', {
        userId,
      });
      console.log('file: port.tsx:17 ~ porttotalData ~ totalData:', totalData);
      setTotalLoading(false);
    } catch (e) {
      console.log('file: port.tsx:16 ~ portBounties ~ e:', e);
      setTotalLoading(false);
    }
  };

  const portJobs = async () => {
    setJobsLoading(true);
    try {
      const jobsData = await axios.post('/api/port/jobs');
      console.log('file: port.tsx:17 ~ porttotalData ~ jobsData:', jobsData);
      setJobsLoading(false);
    } catch (e) {
      console.log('file: port.tsx:16 ~ portBounties ~ e:', e);
      setJobsLoading(false);
    }
  };

  return (
    <Default
      meta={
        <Meta
          title="Port Data | Superteam Earn"
          description="Every Solana opportunity in one place!"
        />
      }
    >
      <Container py={12}>
        <Text fontSize="xl" fontWeight={700}>
          Port Data
        </Text>
        <Input
          mt={4}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user id"
          value={userId}
        />
        <Button
          w="full"
          mt={4}
          isLoading={!!usersLoading}
          loadingText="Porting..."
          onClick={() => portUsers()}
          variant="solid"
        >
          Port Users
        </Button>
        <Button
          w="full"
          mt={4}
          isLoading={!!sponsorsLoading}
          loadingText="Porting..."
          onClick={() => portSponsors()}
          variant="solid"
        >
          Port Sponsors
        </Button>
        <Button
          w="full"
          mt={4}
          isLoading={!!newSponsorsLoading}
          loadingText="Porting..."
          onClick={() => portNewSponsors()}
          variant="solid"
        >
          Port New Sponsors
        </Button>
        <Button
          w="full"
          mt={4}
          isLoading={!!bountiesLoading}
          loadingText="Porting..."
          onClick={() => portBounties()}
          variant="solid"
        >
          Port Bounties
        </Button>
        <Button
          w="full"
          mt={4}
          isLoading={!!grantsLoading}
          loadingText="Porting..."
          onClick={() => portGrants()}
          variant="solid"
        >
          Port Grants
        </Button>
        <Button
          w="full"
          mt={4}
          isLoading={!!totalLoading}
          loadingText="Porting..."
          onClick={() => portTotal()}
          variant="solid"
        >
          Port Total
        </Button>
        <Button
          w="full"
          mt={4}
          isLoading={!!jobsLoading}
          loadingText="Porting..."
          onClick={() => portJobs()}
          variant="solid"
        >
          Port Jobs
        </Button>
      </Container>
    </Default>
  );
}

export default Port;
