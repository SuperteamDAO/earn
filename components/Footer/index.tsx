/* eslint-disable @next/next/no-img-element */
import { Box, Flex, Link, Text, Icon } from '@chakra-ui/react';
import Image from 'next/image';

let TwitterIcon = '/assets/talent/twitter.svg';
let BookmarkIcon = '/assets/landingsponsor/icons/bookmark.svg';
let DiscordIcon = '/assets/landingsponsor/icons/discord.svg';

type Props = {
    style?: any;
};
export const Footer = ({ style }: Props) => (
    <footer
        style={{
            marginTop: 'auto',
            width: '100%',
            borderTop: '0.0625rem solid #E2E8EF',
            padding: '3.125rem 3.125rem',
            ...style,
        }}
    >
        <Flex justifyContent="space-evenly" alignItems="center" gap="1.875rem">
            <Flex alignItems="start" flexFlow="column" w="40%" gap="1.25rem">
                <img src="/assets/logo/logo.png" alt="Icon" />

                <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                    Superteam Earn is where Solana founders find world class talent for
                    their projects. Post bounties, meet your next team member & get things
                    done fast.
                </Text>
                <Flex
                    justifySelf="flex-end"
                    justify="space-around"
                    marginTop="auto"
                    gap="1.25rem"
                    marginBottom="1.25rem"
                >
                    <a
                        href="https://discord.com/invite/Mq3ReaekgG"
                        target="_blank"
                        rel="noreferrer"
                        style={{ cursor: 'pointer' }}
                    >
                        <Image
                            src={DiscordIcon}
                            alt="Discord"
                            width="25px"
                            height="25px"
                        />
                    </a>
                    <a
                        href="https://twitter.com/superteamearn"
                        target="_blank"
                        rel="noreferrer"
                        style={{ cursor: 'pointer' }}
                    >
                        <Image
                            src={TwitterIcon}
                            alt="Discord"
                            width="25px"
                            height="25px"
                        />
                    </a>
                    <a
                        href="https://superteam.substack.com/"
                        target="_blank"
                        rel="noreferrer"
                        style={{ cursor: 'pointer' }}
                    >
                        <Image
                            src={BookmarkIcon}
                            alt="Discord"
                            width="25px"
                            height="25px"
                        />
                    </a>
                </Flex>
            </Flex>

            <Flex alignItems="start" flexFlow="column" gap="0.625rem">
                <Text fontSize="1.125rem" fontWeight={700} color="#4D4D4D" mb="1.25rem">
                    All Superteams
                </Text>
                <Link href="https://superteam.fun" mr="4" isExternal>
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        India
                    </Text>
                </Link>
                <Link href="https://vn.superteam.fun" mr="4" isExternal>
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        Vietnam
                    </Text>
                </Link>
                <Link href="https://tr.superteam.fun" mr="4" isExternal>
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        Turkey
                    </Text>
                </Link>
                <Link href="https://de.superteam.fun" mr="4" isExternal>
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        Germany
                    </Text>
                </Link>
                <Link href="https://mx.superteam.fun" mr="4" isExternal>
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        Mexico
                    </Text>
                </Link>
            </Flex>

            <Flex alignItems="start" flexFlow="column" gap="0.625rem">
                <Text fontSize="1.125rem" fontWeight={700} color="#4D4D4D" mb="1.25rem">
                    Superteam Productions
                </Text>
                <Link href="https://build.superteam.fun" mr="4" isExternal>
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        Build
                    </Text>
                </Link>
                <Link href="https://superteam.substack.com/" mr="4" isExternal>
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        Media
                    </Text>
                </Link>
                <Link href="https://superteam.fun/instagrants" mr="4" isExternal>
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        Grants
                    </Text>
                </Link>
                <Link
                    href="https://www.youtube.com/@superteampodcast"
                    mr="4"
                    isExternal
                >
                    <Text fontSize="1.0625rem" fontWeight={400} color="gray.400">
                        Podcast
                    </Text>
                </Link>
            </Flex>
        </Flex>
    </footer>
);
