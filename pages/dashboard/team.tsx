import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Image,
  Input,
  Skeleton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Avatar from 'boring-avatars';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { SponsorType } from '../../interface/sponsor';
import DashboardLayout from '../../layouts/dashboardLayout';
import { SponsorStore } from '../../store/sponsor';
import { createSponsor, DeleteSponsor, findTeam } from '../../utils/functions';
import { genrateuuid } from '../../utils/helpers';

const Team = () => {
  const { currentSponsor } = SponsorStore();
  const queryClient = useQueryClient();
  const Team = useQuery({
    queryKey: ['team', currentSponsor?.orgId],
    queryFn: ({ queryKey }) => findTeam(queryKey[1] as string),
  });
  const createMemberMutation = useMutation({
    mutationFn: createSponsor,
    onSuccess: () => {
      queryClient.invalidateQueries(['team', currentSponsor?.orgId], {
        exact: true,
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: DeleteSponsor,
    onSuccess: () => {
      toast.success('Successfully Removed');

      queryClient.invalidateQueries(['team', currentSponsor?.orgId], {
        exact: true,
      });
    },

    onError: () => {
      toast.error('Error');
    },
  });
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm();
  const createMember = async (name: string, email: string, address: string) => {
    const sponsor: SponsorType = {
      ...(currentSponsor as SponsorType),
      email: email as string,
      username: name as string,
      publickey: address as string,
      type: 'Member',
      id: genrateuuid(),
    };
    createMemberMutation.mutate(sponsor);
  };

  return (
    <>
      <DashboardLayout>
        <Box w={'full'} fontFamily={'Inter'}>
          <Text
            fontSize="1.3rem"
            color="gray.800"
            fontWeight={600}
            marginTop="4rem"
          >
            Team Members
          </Text>
          <Text mb={5} color="gray.400" fontWeight={500} fontSize="1rem">
            Invite your team to create bounties on Superteam Earn.
          </Text>
          <Flex pr={10} gap={10} justify={'space-between'}>
            <Skeleton w={'60%rem'} isLoaded={!Team.isLoading}>
              <TableContainer w={'100%'}>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>
                        <Text
                          color="gray.300"
                          fontWeight={600}
                          fontSize="0.9rem"
                        >
                          Name
                        </Text>
                      </Th>
                      <Th>
                        <Text
                          color="gray.300"
                          fontWeight={600}
                          fontSize="0.9rem"
                        >
                          Email
                        </Text>
                      </Th>
                      <Th>
                        <Text
                          color="gray.300"
                          fontWeight={600}
                          fontSize="0.9rem"
                        >
                          Role
                        </Text>
                      </Th>
                      <Th>
                        <Text
                          color="gray.300"
                          fontWeight={600}
                          fontSize="0.9rem"
                        >
                          Actions
                        </Text>
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Team.data?.map((el: SponsorType, index: number) => {
                      return (
                        <Tr key={el.id}>
                          <Td w="16rem">
                            <Flex align={'center'} gap={2}>
                              {!el.logo ? (
                                <Avatar />
                              ) : (
                                <Image w={8} src={el.logo} alt={'logo'} />
                              )}
                              <Text
                                color={'gray.800'}
                                fontWeight="500"
                                fontSize={'14px'}
                              >
                                {el?.username}
                              </Text>
                            </Flex>
                          </Td>
                          <Td>
                            <Text
                              color={'gray.500'}
                              fontWeight="500"
                              fontSize={'14px'}
                            >
                              {el.email}
                            </Text>
                          </Td>
                          <Td>
                            <Text
                              bg="#F1F5F9"
                              color={'gray.500'}
                              fontSize="12px"
                              fontWeight={500}
                              p={2}
                              w={'4.5rem'}
                              borderRadius={'10px'}
                              textAlign="center"
                            >
                              {el.type}
                            </Text>
                          </Td>
                          <Td>
                            {el.type === 'Admin' && (
                              <Button variant={'ghost'} isDisabled={true}>
                                <DeleteIcon />
                              </Button>
                            )}
                            {el.type === 'Member' && (
                              <Button
                                onClick={() => {
                                  deleteMemberMutation.mutate(el.id as string);
                                }}
                                variant={'ghost'}
                                isDisabled={
                                  currentSponsor?.type !== 'Admin'
                                    ? true
                                    : false
                                }
                              >
                                <DeleteIcon />
                              </Button>
                            )}
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Skeleton>
            <Flex rounded={'lg'} p={4} width={'25rem'} flexDir="column">
              <Text color={'gray.500'} fontSize="16px" fontWeight={600} mb={5}>
                Add a New Member
              </Text>
              <form
                onSubmit={handleSubmit(async (e) => {
                  await createMember(e.name, e.email, e.address);
                })}
              >
                <Flex flexDir={'column'} w={'full'} px={7} bg={'white'} gap={2}>
                  <FormControl isRequired>
                    <Box fontSize="14px" my={2}>
                      <Text color={'gray.400'} mb="3">
                        Enter their name
                      </Text>
                      <Input
                        {...register('name')}
                        id={'name'}
                        w={'full'}
                        fontSize="14px"
                        placeholder="Name"
                        color={'gray.700'}
                      />
                      <FormErrorMessage>
                        {errors.name ? <>{errors.name.message}</> : <></>}
                      </FormErrorMessage>
                    </Box>
                  </FormControl>
                  <FormControl isRequired>
                    <Box fontSize="14px" mt={2} mb={2}>
                      <Text color={'gray.400'} mb="3">
                        Enter their email
                      </Text>
                      <Input
                        {...register('email')}
                        w={'full'}
                        color={'gray.700'}
                        id={'email'}
                        fontSize="14px"
                        placeholder="Email"
                      />
                      <FormErrorMessage>
                        {errors.email ? <>{errors.email.message}</> : <></>}
                      </FormErrorMessage>
                    </Box>
                  </FormControl>
                  <FormControl isRequired>
                    <Box color={'gray.700'} fontSize="14px" mt={2} mb={2}>
                      <Text color={'gray.400'} mb="3">
                        Enter their wallet address
                      </Text>
                      <Input
                        w={'full'}
                        fontSize="14px"
                        color={'gray.700'}
                        {...register('address')}
                        id={'address'}
                        placeholder="walletAddress"
                      />
                      <FormErrorMessage>
                        {errors.address ? <>{errors.address.message}</> : <></>}
                      </FormErrorMessage>
                    </Box>
                  </FormControl>
                  <Button
                    py={4}
                    color={'white'}
                    bg="#6562FF"
                    borderRadius={'4px'}
                    fontWeight={500}
                    fontSize="14px"
                    w={'full'}
                    _hover={{
                      bg: '#6562FF',
                    }}
                    isLoading={createMemberMutation.isLoading}
                    type="submit"
                  >
                    Send Invite
                  </Button>
                  <Box w="full" h={20} bg={'#F4F3FF'}>
                    <Text
                      color={'#3F3DA1'}
                      fontSize="11px"
                      fontWeight={400}
                      p={4}
                    >
                      Note members can create and fund bounties, but only you
                      can add/remove members
                    </Text>
                  </Box>
                </Flex>
              </form>
            </Flex>
          </Flex>
        </Box>
      </DashboardLayout>
    </>
  );
};

export default Team;
