import { AddIcon, ViewIcon } from '@chakra-ui/icons';
import { Box, Button, Flex, Image, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { type Dispatch, type SetStateAction, useEffect } from 'react';

import { type MultiSelectOptions } from '@/constants';
import { getListingTypeLabel } from '@/features/listings';
import { useUser } from '@/store/user';
import { getURL } from '@/utils/validUrl';

import { isCreateListingAllowedQuery } from '../../queries/is-create-allowed';
import { listingTemplatesQuery } from '../../queries/listing-templates';
import { useListingFormStore } from '../../store';
import { splitSkills } from '../../utils';

interface Props {
  type: 'bounty' | 'project' | 'hackathon';
  setSteps: Dispatch<SetStateAction<number>>;
  setSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
  setSubSkills: Dispatch<SetStateAction<MultiSelectOptions[]>>;
}

export const Template = ({
  type,
  setSteps,
  setSkills,
  setSubSkills,
}: Props) => {
  const { updateState } = useListingFormStore();
  const posthog = usePostHog();
  const { user } = useUser();
  const { data: session } = useSession();

  const { data: templates = [] } = useQuery(listingTemplatesQuery(type));

  const {
    data: isCreateListingAllowed,
    refetch: isCreateListingAllowedRefetch,
  } = useQuery(isCreateListingAllowedQuery);

  useEffect(() => {
    isCreateListingAllowedRefetch();
  }, [user]);

  const createTemplate = (templateId: string) => {
    const template: any = templates.find((t: any) => t?.id === templateId);
    const skillsInfo = splitSkills(template?.skills || []);
    setSkills(skillsInfo?.skills || []);
    setSubSkills(skillsInfo?.subskills || []);

    updateState({
      title: template?.title,
      templateId: template?.id,
      description: template?.description,
    });
    setSteps(2);
  };

  return (
    <VStack align={'start'} gap={8} w="full">
      <VStack align="start" w={'full'}>
        <Flex align="center" justify="center" gap="2rem" w="full" mb="2rem">
          <Text color="gray.600" fontSize="1.3rem" fontWeight={600}>
            {getListingTypeLabel(type)}
          </Text>
          <hr
            style={{
              width: '100%',
              outline: '1px solid #CBD5E1',
              border: 'none',
            }}
          />
        </Flex>
        <Flex wrap={'wrap'} gap={6}>
          <Button
            className="ph-no-capture"
            alignItems={'center'}
            justifyContent={'center'}
            flexDir={'column'}
            display={'flex'}
            w={'15rem'}
            h={'16rem'}
            color="gray.500"
            bg={'white'}
            borderWidth={'1px'}
            borderColor={'brand.slate.200'}
            borderRadius={5}
            _hover={{ color: 'brand.slate.700' }}
            cursor={'pointer'}
            isDisabled={
              isCreateListingAllowed !== undefined &&
              isCreateListingAllowed === false &&
              session?.user.role !== 'GOD'
            }
            onClick={() => {
              posthog.capture('start from scratch_sponsor');
              setSteps(2);
            }}
          >
            <AddIcon mb="1rem" />
            <Text fontSize="1rem" fontWeight={500}>
              Start from Scratch
            </Text>
          </Button>
          {templates.map((template: any) => {
            const sponsors: any = [
              ...new Set(template?.Bounties?.map((b: any) => b.sponsor)),
            ];
            return (
              <Box
                key={template.id}
                w={'15rem'}
                h={'16rem'}
                borderWidth={'1px'}
                borderColor={'brand.slate.200'}
                borderRadius={5}
              >
                <Flex
                  align="center"
                  justify="center"
                  h="45%"
                  fontSize="3xl"
                  bg={template.color || 'white'}
                  borderTopRadius={5}
                >
                  {template?.emoji}
                </Flex>
                <Flex
                  align="start"
                  justify={'space-between'}
                  direction={'column'}
                  h="55%"
                  px={4}
                  py={4}
                >
                  <Box>
                    <Text color={'brand.slate.700'} fontWeight={500}>
                      {template?.title}
                    </Text>
                    {sponsors?.length > 0 ? (
                      <Flex align="center" justify={'start'} mt={1}>
                        <Flex align="center" justify={'start'} mr={6}>
                          {sponsors.length >= 1 && (
                            <Image
                              boxSize="24px"
                              border="1px solid white"
                              borderRadius="full"
                              alt={sponsors[0]?.name}
                              src={sponsors[0]?.logo}
                            />
                          )}
                          {sponsors.length >= 2 && (
                            <Image
                              boxSize="24px"
                              ml={-3}
                              border="1px solid white"
                              borderRadius="full"
                              alt={sponsors[1]?.name}
                              src={sponsors[1]?.logo}
                            />
                          )}
                          {sponsors.length >= 3 && (
                            <Image
                              boxSize="24px"
                              ml={-3}
                              border="1px solid white"
                              borderRadius="full"
                              alt={sponsors[2]?.name}
                              src={sponsors[2]?.logo}
                            />
                          )}
                        </Flex>
                        <Text color="brand.slate.400" fontSize="xs">
                          Used by{' '}
                          {sponsors.length >= 1 && (
                            <Text as="span">{sponsors[0]?.name}</Text>
                          )}
                          {sponsors.length >= 2 && (
                            <Text as="span"> & {sponsors[1]?.name}</Text>
                          )}
                        </Text>
                      </Flex>
                    ) : (
                      <Text color="brand.slate.400" fontSize="sm">
                        {`Pre-fill info with "${template?.title}" template`}
                      </Text>
                    )}
                  </Box>
                  <Flex
                    align="center"
                    justify={'space-between'}
                    gap={4}
                    w="full"
                  >
                    <Button
                      w="full"
                      leftIcon={<ViewIcon />}
                      onClick={() => {
                        window.open(
                          `${getURL()}templates/listings/${template?.slug}`,
                          '_blank',
                        );
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      Preview
                    </Button>
                    <Button
                      className="ph-no-capture"
                      w="full"
                      isDisabled={
                        isCreateListingAllowed !== undefined &&
                        isCreateListingAllowed === false &&
                        session?.user.role !== 'GOD'
                      }
                      onClick={() => {
                        posthog.capture('template_sponsor');
                        createTemplate(template?.id);
                      }}
                      size="sm"
                      variant="solid"
                    >
                      Use
                    </Button>
                  </Flex>
                </Flex>
              </Box>
            );
          })}
        </Flex>
      </VStack>
    </VStack>
  );
};
