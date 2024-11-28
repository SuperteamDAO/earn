import {
  Box,
  Container,
  Flex,
  Image,
  Link,
  Stack,
  Text,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import React from 'react';

import { SolarMail } from '@/constants';
import { Telegram, Twitter } from '@/features/talent';

const FooterColumn = ({
  title,
  links,
}: {
  title: string;
  links: { href: string; text: string }[];
}) => (
  <Stack align="flex-start">
    <Text
      color="brand.slate.400"
      fontSize={{ base: 'xs', md: 'sm' }}
      fontWeight="500"
      textTransform="uppercase"
    >
      {title}
    </Text>
    {links.map((link) => (
      <Link
        key={link.text}
        as={NextLink}
        color="brand.slate.500"
        fontSize={{ base: 'sm', md: 'md' }}
        _hover={{ color: 'brand.slate.600' }}
        href={link.href}
      >
        {link.text}
      </Link>
    ))}
  </Stack>
);

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const opportunities = [
    { text: '赏金任务', href: '/bounties' },
    { text: '定向任务', href: '/projects' },
    { text: '资助', href: '/grants' },
  ];

  const categories = [
    { text: '内容', href: '/category/content' },
    { text: '设计', href: '/category/design' },
    { text: '开发', href: '/category/development' },
    { text: '其他', href: '/category/other' },
  ];

  const about = [
    {
      text: '常见问题',
      href: '/guide.pdf',
    },
    {
      text: '条款',
      href: '/terms.pdf',
    },
    { text: '隐私政策', href: '/policy.pdf' },
    {
      text: '联系我们',
      href: `mailto:${SolarMail}`,
    },
  ];

  return (
    <Box as="footer" bg="white" borderTop="1px" borderTopColor="blackAlpha.200">
      <Container maxW="7xl" py={8}>
        <Flex
          align="flex-start"
          justify="space-between"
          direction={{ base: 'column', md: 'row' }}
        >
          <Flex direction="column" maxW="540px" mb={{ base: 8, md: 0 }}>
            <Flex align="center" mb={4}>
              <Image
                h={6}
                mr={4}
                alt="Solar Earn"
                src="/assets/logo/logo-light.png"
              />
            </Flex>
            <Text
              mb={6}
              color="brand.slate.500"
              fontSize={{ base: 'sm', md: 'md' }}
            >
              连接 Solana 华语区人才和项目方，一站式自助申请 Solana
              生态项目的赏金任务，做任务，赢赏金！
            </Text>
            <Flex gap={4}>
              <Twitter link="https://x.com/Solana_zh" />
              <Telegram link="https://t.me/solanaZH_official" />
              <Telegram link="https://t.me/solanadevcamp" />
            </Flex>
          </Flex>
          <Flex
            justify={{ base: 'flex-start', md: 'flex-end' }}
            wrap="wrap"
            gap={{ base: 6, md: 16 }}
            w={{ base: '100%', md: 'auto' }}
          >
            <FooterColumn title="项目机会" links={opportunities} />
            <FooterColumn title="人才类型" links={categories} />
            <FooterColumn title="关于" links={about} />
          </Flex>
        </Flex>
      </Container>
      <Box py={4} pb={{ base: 20, md: 4 }} bg="gray.100">
        <Container maxW="7xl">
          <Flex
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            direction={{ base: 'column', md: 'row' }}
          >
            <Text mb={{ base: 4, md: 0 }} color="brand.slate.500" fontSize="sm">
              {currentYear} Solar. 保留最终解释权
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};
