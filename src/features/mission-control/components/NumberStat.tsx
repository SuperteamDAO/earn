import { Card, Flex, Image, Text } from '@chakra-ui/react';
import React from 'react';

interface NumberStatCardProps {
  amount: number;
  title: string;
  children: React.ReactNode;
  isUsd?: boolean;
  iconBg: string;
}

export const NumberStatCard: React.FC<NumberStatCardProps> = ({
  amount,
  title,
  children,
  iconBg,
  isUsd = true,
}) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return (
    <Card
      w="18rem"
      p={4}
      bg="white"
      borderWidth={1}
      borderColor="brand.slate.300"
      borderRadius="md"
      shadow="none"
    >
      <Flex align="center" gap={4}>
        <Flex
          align="center"
          justify="center"
          w={10}
          h={10}
          bg={iconBg}
          borderRadius="full"
        >
          {children}
        </Flex>
        <Flex direction="column">
          <Text color="gray.500" fontSize="sm">
            {title}
          </Text>
          <Flex align="center" gap={1}>
            {isUsd && (
              <Image
                w={6}
                h={6}
                alt="USDC ICON"
                src="https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png"
              />
            )}
            <Text fontSize="lg" fontWeight="bold">
              {isUsd ? formattedAmount : amount}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
};
