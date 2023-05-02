import { Button, Container, Input, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';

function Port() {
  const [userId, setUserId] = useState('ab15dd8c-fad7-4c74-880b-6b334f8d2a39');
  const [sponsorsLoading, setSponsorsLoading] = useState(false);
  const [bountiesLoading, setBountiesLoading] = useState(false);

  const portSponsors = async () => {
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

  const portBounties = async () => {
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
          isLoading={!!bountiesLoading}
          loadingText="Porting..."
          onClick={() => portBounties()}
          variant="solid"
        >
          Port Bounties
        </Button>
      </Container>
    </Default>
  );
}

export default Port;
