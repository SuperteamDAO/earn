import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Link,
  Text,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { type ReactNode } from 'react';

import { skillMap } from '@/constants';
import { EarnAvatar, Telegram, Twitter, Website } from '@/features/talent';

import { type LocalProfile } from '../../queries';

export const UserDrawer = ({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: LocalProfile;
}) => {
  const parentSkills = user.skills.map((skill: any) => skill.skills);
  const subSkills = user.skills.flatMap((skill: any) => skill.subskills);
  const socialLinks = [
    { Component: Telegram, link: user.telegram },
    { Component: Twitter, link: user.twitter },
    { Component: Website, link: user?.website },
  ];

  const formattedCreatedAt = dayjs(user.createdAt).format('DD MMM YYYY');

  const DBadge = ({ children }: { children: ReactNode }) => {
    return (
      <Badge
        px={'12px'}
        py={'4px'}
        color={'#64739C'}
        fontSize={'xs'}
        fontWeight={500}
        borderRadius={'4px'}
        bgColor={'#EFF1F5'}
      >
        {children}
      </Badge>
    );
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="xl">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerBody p={6}>
          <Flex direction="column" gap={6}>
            <Flex
              align="center"
              justify="space-between"
              pb={6}
              borderColor={'brand.slate.300'}
              borderBottomWidth={'1px'}
            >
              <Flex align="center">
                <EarnAvatar size="44px" id={user?.id} avatar={user?.photo} />
                <Box ml={4}>
                  <Flex gap={3}>
                    <Text
                      fontWeight={500}
                    >{`${user?.firstName} ${user?.lastName}`}</Text>
                  </Flex>
                  <Text mt={-0.5} color="brand.slate.500" fontSize={'0.92rem'}>
                    {user?.email}
                  </Text>
                </Box>
              </Flex>
              <Flex align={'center'} gap={10}>
                <Flex
                  align="center"
                  justify="center"
                  direction="column"
                  alignSelf={'center'}
                  textAlign="center"
                >
                  <Text
                    color="brand.slate.500"
                    fontSize="1.05rem"
                    fontWeight={500}
                  >
                    {user?.wins}
                  </Text>
                  <Text color="brand.slate.500" fontSize={'0.92rem'}>
                    获奖
                  </Text>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  direction="column"
                  alignSelf={'center'}
                  textAlign="center"
                >
                  <Text
                    color="brand.slate.500"
                    fontSize="1.05rem"
                    fontWeight={500}
                  >
                    {user?.totalSubmissions}
                  </Text>
                  <Text color="brand.slate.500" fontSize={'0.92rem'}>
                    提交
                  </Text>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  direction="column"
                  alignSelf={'center'}
                  textAlign="center"
                >
                  <Text
                    color="brand.slate.500"
                    fontSize="1.05rem"
                    fontWeight={500}
                  >
                    ${user.totalEarnings.toLocaleString()}
                  </Text>
                  <Text color="brand.slate.500" fontSize={'0.92rem'}>
                    $ 赚取
                  </Text>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  direction="column"
                  alignSelf={'center'}
                  textAlign="center"
                >
                  <Text
                    color="brand.slate.500"
                    fontSize="1.05rem"
                    fontWeight={500}
                  >
                    #{user?.rank}
                  </Text>
                  <Text color="brand.slate.500" fontSize={'0.92rem'}>
                    # Rank
                  </Text>
                </Flex>

                <Link
                  as={NextLink}
                  pl={6}
                  color="brand.slate.500"
                  fontSize={'0.9rem'}
                  fontWeight={500}
                  href={`/t/${user.username}`}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View Profile <ArrowForwardIcon />
                </Link>
              </Flex>
            </Flex>

            <Box>
              <Text mb={2} color="brand.slate.400" fontWeight={500}>
                Socials
              </Text>
              <Flex gap={2}>
                {socialLinks.map(({ Component, link }, index) => (
                  <Box key={index}>
                    <Component
                      link={link}
                      boxSize={5}
                      color="brand.slate.600"
                    />
                  </Box>
                ))}
              </Flex>
            </Box>

            <Box>
              <Text mb={2} color="brand.slate.400" fontWeight={500}>
                简介
              </Text>
              <Text color="brand.slate.500">{user.bio || '-'}</Text>
            </Box>

            <Box>
              <Text mb={2} color="brand.slate.400" fontWeight={500}>
                Discord
              </Text>
              <Text color="brand.slate.500">{user.discord || '-'}</Text>
            </Box>

            <Box>
              <Text mb={2} color="brand.slate.400" fontWeight={500}>
                技能
              </Text>
              <Flex wrap="wrap" gap={2}>
                {parentSkills.length > 0 ? (
                  parentSkills.map((skill: string) => (
                    <Badge
                      key={skill}
                      px={'12px'}
                      py={'4px'}
                      color={`${skillMap.find((e) => e.mainskill === skill)?.color}`}
                      fontSize={'xs'}
                      fontWeight={500}
                      bg={`${skillMap.find((e) => e.mainskill === skill)?.color}1A`}
                      borderRadius={'4px'}
                    >
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <Text color="brand.slate.500">-</Text>
                )}
              </Flex>
            </Box>

            <Box>
              <Text mb={2} color="brand.slate.400" fontWeight={500}>
                子技能
              </Text>
              <Flex wrap="wrap" gap={2}>
                {subSkills.length > 0 ? (
                  subSkills.map((skill: string) => (
                    <DBadge key={skill}>{skill}</DBadge>
                  ))
                ) : (
                  <Text color="brand.slate.500">-</Text>
                )}
              </Flex>
            </Box>

            <Box>
              <Text mb={2} color="brand.slate.400" fontWeight={500}>
                爱好
              </Text>
              <Flex wrap="wrap" gap={2}>
                <Text color="brand.slate.500">
                  {(() => {
                    const interests = JSON.parse(user?.interests || '[]');
                    return interests.length > 0 ? interests.join(', ') : '-';
                  })()}
                </Text>
              </Flex>
            </Box>

            <Box>
              <Text mb={2} color="brand.slate.400" fontWeight={500}>
                社区
              </Text>
              <Text color="brand.slate.500">
                {(() => {
                  const communities = JSON.parse(user?.community || '[]');
                  return communities.length > 0 ? communities.join(', ') : '-';
                })()}
              </Text>
            </Box>
            <Box>
              <Text mb={2} color="brand.slate.400" fontWeight={500}>
                创建日期
              </Text>
              <Text color="brand.slate.500">{formattedCreatedAt}</Text>
            </Box>
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
