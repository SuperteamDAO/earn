import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { Dispatch, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Skill, SkillList, TalentSkillMap } from '../../interface/types';
import { BountyBasicType } from './Createbounty';
interface Props {
  setbountyBasic: Dispatch<SetStateAction<BountyBasicType | undefined>>;
  setSteps: Dispatch<SetStateAction<number>>;
}
export const CreatebountyBasic = ({ setbountyBasic, setSteps }: Props) => {
  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm();
  // Handles the selected skill for menu
  const [selectedSkill, setSelectedSkill] = useState<Skill | undefined>(
    undefined
  );
  // holds the change in state
  const [skills, setSkills] = useState<string[]>([]);

  // list for Time
  const TimeList = [
    '< 1 Week',
    '< 1 Hour',
    '< 1 Day',
    '< 1 Month',
    '< 1 Months',
    '< 3 Months',
  ];
  return (
    <>
      <VStack pt={7} align={'start'} w={'2xl'}>
        <form
          onSubmit={handleSubmit((e) => {
            setbountyBasic({
              title: e.title,
              contact: e.handle,
              deadline: e.deadline,
              estimatedTime: e.time,
              skills: '',
            });
            setSteps(3);
          })}
          style={{ width: '100%' }}
        >
          <FormControl mb={5} w="full" isRequired>
            <Flex>
              <FormLabel
                color={'gray.400'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'title'}
              >
                Opportunity Title
              </FormLabel>
              <Tooltip
                placement="right-end"
                fontSize="0.9rem"
                padding="0.7rem"
                bg="#6562FF"
                color="white"
                fontWeight={600}
                borderRadius="0.5rem"
                hasArrow
                w="max"
                label={`Who will respond to questions about the opportunity from your team?`}
              >
                <Image
                  mt={-2}
                  src={'/assets/icons/info-icon.svg'}
                  alt={'Info Icon'}
                />
              </Tooltip>
            </Flex>

            <Input
              id="title"
              placeholder="Develop a new landing page"
              {...register('title')}
            />
            <FormErrorMessage>
              {errors.title ? <>{errors.title.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>

          <FormControl w="full" isRequired>
            <Flex align={'center'} justify={'start'}>
              <FormLabel
                color={'gray.400'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'title'}
              >
                Point of Contact
              </FormLabel>
              <Tooltip
                placement="right-end"
                fontSize="0.9rem"
                padding="0.7rem"
                bg="#6562FF"
                color="white"
                fontWeight={600}
                borderRadius="0.5rem"
                hasArrow
                w="max"
                label={`Who will respond to questions about the opportunity from your team?`}
              >
                <Image
                  mt={-2}
                  src={'/assets/icons/info-icon.svg'}
                  alt={'Info Icon'}
                />
              </Tooltip>
            </Flex>
            <Input
              id="handle"
              placeholder="@telegram handle"
              {...register('handle')}
            />
            <FormErrorMessage>
              {errors.handle ? <>{errors.handle.message}</> : <></>}
            </FormErrorMessage>
          </FormControl>
          <FormControl my={6}>
            <Flex align={'center'} justify={'start'}>
              <FormLabel
                color={'gray.400'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'skills'}
              >
                Skills Needed
              </FormLabel>
              <Tooltip
                placement="right-end"
                fontSize="0.9rem"
                padding="0.7rem"
                bg="#6562FF"
                color="white"
                fontWeight={600}
                borderRadius="0.5rem"
                hasArrow
                w="max"
                label={`Select all that apply`}
              >
                <Image
                  mt={-2}
                  src={'/assets/icons/info-icon.svg'}
                  alt={'Info Icon'}
                />
              </Tooltip>
            </Flex>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                w="100%"
                h="2.7rem"
                mb={3}
                fontSize="0.9rem"
                fontWeight={500}
                color={selectedSkill ? 'gray.500' : 'gray.300'}
                bg="transparent"
                border={errors.type ? '2px solid #FF8585' : '1px solid #e2e8f0'}
                textAlign="start"
              >
                {selectedSkill || 'Select'}
              </MenuButton>
              <MenuList
                zIndex={10}
                overflow="scroll"
                w="fullrem"
                fontSize="0.9rem"
                fontWeight={500}
                color="gray.400"
              >
                {SkillList.map((skill) => (
                  <MenuItem key={skill} onClick={() => setSelectedSkill(skill)}>
                    {skill}
                  </MenuItem>
                ))}
              </MenuList>
            </Menu>

            {selectedSkill && (
              <>
                <Flex
                  flexWrap="wrap"
                  rowGap={3}
                  color="gray.400"
                  justify="space-between"
                >
                  {TalentSkillMap[selectedSkill].map((skill: string) => (
                    <Checkbox
                      key={skill}
                      _invalid={{ color: '#FF8585' }}
                      size="lg"
                      flex="0 0 33.3%"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSkills([...skills, skill]);
                        } else {
                          console.log(
                            skills.splice(skills.indexOf(skill) - 1, 1),
                            'change'
                          );

                          setSkills(skills.splice(skills.indexOf(skill), 1));
                        }
                      }}
                    >
                      <Text fontSize="0.9rem">{skill}</Text>
                    </Checkbox>
                  ))}
                </Flex>
              </>
            )}
          </FormControl>
          <HStack w={'full'} justify={'space-between'} my={6}>
            <FormControl w={'18rem'} isRequired>
              <Flex align={'center'} justify={'start'}>
                <FormLabel
                  color={'gray.400'}
                  fontWeight={600}
                  fontSize={'15px'}
                  htmlFor={'deadline'}
                >
                  Deadline
                </FormLabel>
                <Tooltip
                  placement="right-end"
                  fontSize="0.9rem"
                  padding="0.7rem"
                  bg="#6562FF"
                  color="white"
                  fontWeight={600}
                  borderRadius="0.5rem"
                  hasArrow
                  w="max"
                  label={`Who will respond to questions about the opportunity from your team?`}
                >
                  <Image
                    mt={-2}
                    src={'/assets/icons/info-icon.svg'}
                    alt={'Info Icon'}
                  />
                </Tooltip>
              </Flex>
              <Input
                w={'full'}
                id="deadline"
                type={'date'}
                placeholder="deadline"
                color={'gray.500'}
                {...register('deadline')}
              />
              <FormErrorMessage>
                {errors.deadline ? <>{errors.deadline.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
            <FormControl w={'18rem'} isRequired>
              <FormLabel
                color={'gray.400'}
                fontWeight={600}
                fontSize={'15px'}
                htmlFor={'time'}
              >
                Estimated Time to complete
              </FormLabel>

              <Select
                id="time"
                placeholder="Estimated Time to complete"
                {...register('time')}
                defaultValue={TimeList[0]}
                color={'gray.500'}
              >
                {TimeList.map((el) => {
                  return (
                    <option key={el} value={el}>
                      {el}
                    </option>
                  );
                })}
              </Select>
              <FormErrorMessage>
                {errors.time ? <>{errors.time.message}</> : <></>}
              </FormErrorMessage>
            </FormControl>
          </HStack>
          <VStack gap={6} mt={10}>
            <Button
              w="100%"
              bg={'#6562FF'}
              color={'white'}
              fontSize="1rem"
              fontWeight={600}
              type={'submit'}
            >
              Continue
            </Button>
            <Button
              w="100%"
              fontSize="1rem"
              fontWeight={600}
              color="gray.500"
              border="1px solid"
              borderColor="gray.200"
              bg="transparent"
            >
              Save as Drafts
            </Button>
          </VStack>
        </form>
      </VStack>
    </>
  );
};
