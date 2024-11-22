import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Text,
  Textarea,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import ReactSelect from 'react-select';
import makeAnimated from 'react-select/animated';
import { toast } from 'sonner';

import { InputField } from '@/components/Form/InputField';
import { SelectBox } from '@/components/Form/SelectBox';
import { ImagePicker } from '@/components/shared/ImagePicker';
import { SkillSelect } from '@/components/shared/SkillSelect';
import {
  CountryList,
  IndustryList,
  type MultiSelectOptions,
  web3Exp,
  workExp,
  workType,
} from '@/constants';
import {
  AddProject,
  SocialInput,
  useUsernameValidation,
} from '@/features/talent';
import type { PoW } from '@/interface/pow';
import { skillSubSkillMap, type SubSkillsType } from '@/interface/skills';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';
import { validateSolAddressUI } from '@/utils/validateSolAddress';

type FormData = {
  username: string;
  photo?: string;
  firstName?: string;
  lastName?: string;
  interests?: { value: string }[];
  bio?: string;
  twitter?: string;
  discord?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  telegram?: string;
  community?: { label: string; value: string }[];
  experience?: string;
  location?: string;
  cryptoExperience?: string;
  workPrefernce?: string;
  currentEmployer?: string;
  skills?: any;
  private: boolean;
  publicKey?: string;
};

const parseSkillsAndSubskills = (skillsObject: any) => {
  const skills: MultiSelectOptions[] = [];
  const subSkills: MultiSelectOptions[] = [];

  skillsObject.forEach((skillItem: { skills: string; subskills: string[] }) => {
    skills.push({ value: skillItem.skills, label: skillItem.skills });
    skillItem.subskills.forEach((subSkill) => {
      subSkills.push({ value: subSkill, label: subSkill });
    });
  });

  return { skills, subSkills };
};

export default function EditProfilePage({ slug }: { slug: string }) {
  const { user, refetchUser } = useUser();
  const { data: session, status } = useSession();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>();

  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(true);

  const router = useRouter();
  const posthog = usePostHog();

  const [pow, setPow] = useState<PoW[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const editableFields = Object.keys(user || {}) as (keyof FormData)[];

  const animatedComponents = makeAnimated();
  const [DropDownValues, setDropDownValues] = useState<{
    interests: { label: string; value: string }[];
    community: { label: string; value: string }[];
  }>({
    interests: user?.interests ? JSON.parse(user?.interests) : [],
    community: user?.community ? JSON.parse(user.community) : [],
  });

  const [skills, setSkills] = useState<MultiSelectOptions[]>([]);
  const [subSkills, setSubSkills] = useState<MultiSelectOptions[]>([]);

  const privateValue = watch('private', user?.private);

  const { setUsername, isInvalid, validationErrorMessage } =
    useUsernameValidation();

  useEffect(() => {
    if (user) {
      editableFields.forEach((field) => {
        setValue(field, user[field]);
      });

      if (user.interests) {
        const interestsArray: string[] = JSON.parse(user.interests);
        const interestSelectValues = interestsArray.map((item) => ({
          label: item,
          value: item,
        }));
        setValue('interests', interestSelectValues);
        setDropDownValues((prev) => ({
          ...prev,
          interests: interestSelectValues,
        }));
      }

      if (user?.community) {
        const communityArray: string[] = JSON.parse(user.community);
        const communitySelectValues = communityArray.map((item) => ({
          label: item,
          value: item,
        }));
        setValue('community', communitySelectValues);
        setDropDownValues((prev) => ({
          ...prev,
          community: communitySelectValues,
        }));
      }

      if (user.experience) {
        setValue('experience', user.experience);
      }

      if (user.location) {
        setValue('location', user.location);
      }

      if (user.private) {
        setValue('private', user.private);
      }

      if (user?.skills && Array.isArray(user.skills)) {
        const { skills: parsedSkills, subSkills: parsedSubSkills } =
          parseSkillsAndSubskills(user.skills);
        setSkills(parsedSkills);
        setSubSkills(parsedSubSkills);
      }

      if (user?.photo) {
        setValue('photo', user.photo);
        setPhotoUrl(user.photo);
        setIsPhotoLoading(false);
      } else {
        setIsPhotoLoading(false);
      }

      if (user.publicKey) {
        setValue('publicKey', user.publicKey);
      }
    }
  }, [user, setValue]);

  useEffect(() => {
    const fetchPoW = async () => {
      try {
        const response = await axios.get('/api/pow/get', {
          params: {
            userId: user?.id,
          },
        });
        setPow(response.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (user?.id) {
      fetchPoW();
    }
  }, [user?.id]);

  const onSubmit = async (data: FormData) => {
    if (isInvalid) {
      return;
    }
    const socialFields = [
      'telegram',
      'twitter',
      'github',
      'linkedin',
      'website',
    ];
    const filledSocials = socialFields.filter(
      (field) => data[field as keyof FormData],
    );

    if (filledSocials.length === 0) {
      toast.error(
        'At least one additional social link (apart from Discord) is required',
      );
      return;
    }

    setIsLoading(true);
    posthog.capture('confirm_edit profile');
    try {
      const interestsArray = (data.interests || []).map((item) => item.value);
      const interestsJSON = JSON.stringify(interestsArray);

      const communityArray = (data.community || []).map((item) => item.value);
      const communityJSON = JSON.stringify(communityArray);

      const combinedSkills = skills.map((mainskill) => {
        const main =
          skillSubSkillMap[mainskill.value as keyof typeof skillSubSkillMap];
        const sub: SubSkillsType[] = [];

        subSkills.forEach((subskill) => {
          if (
            main &&
            main.some((subSkillObj) => subSkillObj.value === subskill.value)
          ) {
            sub.push(subskill.value as SubSkillsType);
          }
        });

        return {
          skills: mainskill.value,
          subskills: sub ?? [],
        };
      });

      const updatedData = {
        ...data,
        interests: interestsJSON,
        community: communityJSON,
        skills: combinedSkills,
      };

      const finalUpdatedData = Object.keys(updatedData).reduce((acc, key) => {
        const fieldKey = key as keyof FormData;
        if (user && updatedData[fieldKey] !== user[fieldKey]) {
          acc[fieldKey] = updatedData[fieldKey];
        }
        return acc;
      }, {} as Partial<FormData>);

      toast.promise(
        async () => {
          await axios.post('/api/pow/edit', {
            pows: pow,
          });

          await axios.post('/api/user/edit', { ...finalUpdatedData });

          await refetchUser();

          setIsLoading(false);

          setTimeout(() => {
            router.push(`/t/${data.username}`);
          }, 500);
        },
        {
          loading: 'Updating your profile...',
          success: 'Your profile has been updated successfully!',
          error: 'Failed to update profile.',
        },
      );
    } catch (error: any) {
      toast.error('Failed to update profile.');
    }
  };

  useEffect(() => {
    if (user && slug !== user?.username) {
      router.push(`/t/${slug}`);
    }
  }, [slug, router, user]);

  if (!session && status === 'unauthenticated') {
    router.push('/');
  }

  return (
    <>
      <Default
        meta={
          <Meta
            title="Solar Earn"
            description="Every Solana opportunity in one place!"
          />
        }
      >
        <Box bg="#fff">
          <Box maxW="600px" mx="auto" p={{ base: 3, md: 5 }}>
            <Heading mt={3} mb={5}>
              修改配置
            </Heading>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Text
                mt={12}
                mb={5}
                color={'brand.slate.600'}
                fontSize="lg"
                fontWeight={600}
                letterSpacing={0.4}
              >
                个人信息
              </Text>
              <FormControl>
                <Box mb={4}>
                  <FormLabel
                    mb={'1'}
                    pb={'0'}
                    color={'brand.slate.500'}
                    requiredIndicator={<></>}
                  >
                    项目图片
                  </FormLabel>
                  {isPhotoLoading ? (
                    <></>
                  ) : photoUrl ? (
                    <ImagePicker
                      defaultValue={{ url: photoUrl }}
                      onChange={async (e) => {
                        setUploading(true);
                        const a = await uploadToCloudinary(e, 'earn-pfp');
                        setValue('photo', a);
                        setUploading(false);
                      }}
                      onReset={() => {
                        setValue('photo', '');
                        setUploading(false);
                      }}
                    />
                  ) : (
                    <ImagePicker
                      onChange={async (e) => {
                        setUploading(true);
                        const a = await uploadToCloudinary(e, 'earn-pfp');
                        setValue('photo', a);
                        setUploading(false);
                      }}
                      onReset={() => {
                        setValue('photo', '');
                        setUploading(false);
                      }}
                    />
                  )}
                </Box>
              </FormControl>
              <InputField
                label="用户名"
                placeholder="用户名"
                name="username"
                register={register}
                isRequired
                onChange={(e) => setUsername(e.target.value)}
                isInvalid={isInvalid}
                validationErrorMessage={validationErrorMessage}
                errors={errors}
              />

              <InputField
                label="名"
                placeholder="名"
                name="firstName"
                register={register}
                isRequired
                errors={errors}
              />

              <InputField
                label="姓"
                placeholder="姓"
                name="lastName"
                register={register}
                isRequired
                errors={errors}
              />

              <Box w={'full'} mb={'1.25rem'}>
                <FormLabel color={'brand.slate.500'}>个人简介</FormLabel>
                <Textarea
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  focusBorderColor="brand.purple"
                  id={'bio'}
                  maxLength={180}
                  placeholder=""
                  {...register('bio', { required: false })}
                />
                <Text
                  color={
                    (watch('bio')?.length || 0) > 160
                      ? 'red'
                      : 'brand.slate.400'
                  }
                  fontSize={'xs'}
                  textAlign="right"
                >
                  还剩 {180 - (watch('bio')?.length || 0)} 字
                </Text>
              </Box>
              <InputField
                label="你的 Solana 钱包地址"
                placeholder="钱包地址"
                name="publicKey"
                register={register}
                isRequired
                isInvalid={!!errors.publicKey}
                validate={(value: string) => {
                  return validateSolAddressUI(value);
                }}
                validationErrorMessage={validationErrorMessage}
                errors={errors}
              />
              <Text
                mt={12}
                mb={5}
                color={'brand.slate.600'}
                fontSize="lg"
                fontWeight={600}
                letterSpacing={0.4}
              >
                社交信息
              </Text>

              <SocialInput register={register} watch={watch} />

              <Text
                mt={12}
                mb={5}
                color={'brand.slate.600'}
                fontSize="lg"
                fontWeight={600}
                letterSpacing={0.4}
              >
                工作经历
              </Text>

              <FormControl w={'full'} mb={'1.25rem'}>
                <FormLabel color={'brand.slate.500'}>
                  你对 Web3 的哪些领域感兴趣？
                </FormLabel>
                <ReactSelect
                  closeMenuOnSelect={false}
                  components={animatedComponents}
                  isMulti
                  options={IndustryList.map((elm: string) => {
                    return { label: elm, value: elm };
                  })}
                  value={DropDownValues.interests}
                  onChange={(selectedOptions: any) => {
                    const selectedInterests = selectedOptions
                      ? selectedOptions.map(
                        (elm: { label: string; value: string }) => elm,
                      )
                      : [];
                    setDropDownValues({
                      ...DropDownValues,
                      interests: selectedInterests,
                    });
                    setValue('interests', selectedInterests);
                  }}
                  styles={{
                    control: (baseStyles) => ({
                      ...baseStyles,
                      backgroundColor: 'brand.slate.500',
                      borderColor: 'brand.slate.300',
                    }),
                  }}
                />
              </FormControl>

              <SelectBox
                label="工作经验"
                watchValue={watch('experience')}
                options={workExp}
                id="experience"
                placeholder="选择工作年限"
                register={register}
              />

              <SelectBox
                label="城市"
                watchValue={watch('location')}
                options={CountryList}
                id="location"
                placeholder="选择城市"
                register={register}
              />

              <SelectBox
                label="你对Web3有多熟悉？"
                watchValue={watch('cryptoExperience')}
                options={web3Exp}
                id="cryptoExperience"
                placeholder="请选择"
                register={register}
              />

              <SelectBox
                label="工作性质"
                watchValue={watch('workPrefernce')}
                options={workType}
                id="workPrefernce"
                placeholder="请选择"
                register={register}
              />

              <InputField
                label="当前公司"
                placeholder="当前公司"
                name="currentEmployer"
                register={register}
                errors={errors}
              />

              <FormLabel color={'brand.slate.500'}>工作经历</FormLabel>
              <Box>
                {pow.map((data, idx) => {
                  return (
                    <Flex
                      key={data.id}
                      align={'center'}
                      mt="2"
                      mb={'1.5'}
                      px={'1rem'}
                      py={'0.5rem'}
                      color={'brand.slate.500'}
                      border={'1px solid gray'}
                      borderColor="brand.slate.300"
                      rounded={'md'}
                    >
                      <Text w={'full'} color={'gray.800'} fontSize={'0.8rem'}>
                        {data.title}
                      </Text>
                      <Center columnGap={'0.8rem'}>
                        <EditIcon
                          onClick={() => {
                            setSelectedProject(idx);
                            onOpen();
                          }}
                          cursor={'pointer'}
                          fontSize={'0.8rem'}
                        />
                        <DeleteIcon
                          onClick={() => {
                            setPow((prevPow) =>
                              prevPow.filter((_ele, id) => idx !== id),
                            );
                          }}
                          cursor={'pointer'}
                          fontSize={'0.8rem'}
                        />
                      </Center>
                    </Flex>
                  );
                })}
              </Box>
              <Button
                w={'full'}
                mb={8}
                leftIcon={<AddIcon />}
                onClick={() => {
                  onOpen();
                }}
                variant="outline"
              >
                添加项目
              </Button>

              <SkillSelect
                skills={skills}
                subSkills={subSkills}
                setSkills={setSkills}
                setSubSkills={setSubSkills}
                skillLabel="技能"
                subSkillLabel="子技能"
                helperText="我们将发送新项目的电子邮件通知，针对您选择的技能。"
              />

              <Checkbox
                mr={1}
                mb={8}
                color="brand.slate.500"
                fontWeight={500}
                _checked={{
                  '& .chakra-checkbox__control': {
                    background: 'brand.purple',
                    borderColor: 'brand.purple',
                  },
                }}
                colorScheme="purple"
                isChecked={privateValue}
                onChange={(e) => {
                  setValue('private', e.target.checked);
                }}
                size="md"
              >
                保密个人信息
              </Checkbox>
              <br />

              <Button
                className="ph-no-capture"
                mb={12}
                isLoading={uploading || isLoading}
                type="submit"
              >
                更新
              </Button>
            </form>
          </Box>
        </Box>
        <AddProject
          key={`${pow.length}project`}
          {...{
            isOpen,
            onClose,
            pow,
            setPow,
            selectedProject,
            setSelectedProject,
          }}
        />
      </Default>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.query;
  return {
    props: { slug },
  };
};
