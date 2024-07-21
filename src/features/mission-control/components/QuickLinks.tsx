import { Box, Button, Flex, Heading, Link } from '@chakra-ui/react';
import React from 'react';
import { LuArrowRight } from 'react-icons/lu';

interface QuickLink {
  text: string;
  href: string;
}

interface QuickLinksProps {
  links: QuickLink[];
}

export const QuickLinks: React.FC<QuickLinksProps> = ({ links }) => {
  return (
    <Box w="full" p={6} bg="#FAF5FF" borderRadius="lg">
      <Heading mb={4} color="gray.800" size="sm">
        Quick Links
      </Heading>
      <Flex wrap="wrap" rowGap={4} columnGap={3}>
        {links.map((link, index) => (
          <Link
            key={index}
            _hover={{ textDecoration: 'none' }}
            href={link.href}
          >
            <Button
              justifyContent="space-between"
              w="full"
              h={'auto'}
              px={6}
              py={2}
              color="brand.slate.500"
              fontSize="sm"
              fontWeight={600}
              bg="white"
              border={0}
              borderRadius={'full'}
              _hover={{ bg: 'gray.50' }}
              rightIcon={<LuArrowRight />}
              variant="outline"
            >
              {link.text}
            </Button>
          </Link>
        ))}
      </Flex>
    </Box>
  );
};
