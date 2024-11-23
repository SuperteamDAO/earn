import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React, { useState } from 'react';
import { AiOutlineSend } from 'react-icons/ai';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    );
};

export function InviteMembers({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState<string>('');
  const [memberType, setMemberType] = useState<string>('MEMBER');

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/member-invites/send/', {
        email,
        memberType,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('邀请发送成功');
    },
    onError: (error) => {
      console.error('Invite error:', error);
      toast.error('邀请发送失败，请重试');
    },
  });

  const handleInput = (emailString: string) => {
    const isEmail = validateEmail(emailString);
    if (isEmail) {
      setEmail(emailString);
    } else {
      setEmail('');
    }
  };

  const sendInvites = () => {
    inviteMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>邀请团队成员</ModalHeader>
        <ModalCloseButton />
        {inviteMutation.isSuccess ? (
          <>
            <ModalBody>
              <Alert
                alignItems="center"
                justifyContent="center"
                flexDir="column"
                py={8}
                textAlign="center"
                borderRadius="md"
                status="success"
                variant="subtle"
              >
                <AlertIcon boxSize="40px" mr={4} />
                <Box>
                  <AlertTitle>邀请已发送！</AlertTitle>
                  <AlertDescription>
                    你的团队成员将收到电子邮件，包含加入 Solar Earn 的邀请链接。
                  </AlertDescription>
                </Box>
              </Alert>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} variant="solid">
                关闭
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalBody>
              <FormControl isInvalid={inviteMutation.isError}>
                <FormLabel mb={0}>添加邮箱</FormLabel>
                <Input
                  color="brand.slate.500"
                  borderColor="brand.slate.300"
                  _placeholder={{
                    color: 'brand.slate.300',
                  }}
                  focusBorderColor="brand.purple"
                  onChange={(e) => handleInput(e.target.value)}
                  type="email"
                />
                <FormErrorMessage>
                  Sorry! Error occurred while sending invite.
                </FormErrorMessage>
              </FormControl>
              <Stack pt={4}>
                <FormLabel mb={0}>成员类型</FormLabel>
                <RadioGroup
                  defaultValue={memberType}
                  onChange={(value) => setMemberType(value)}
                >
                  <Radio
                    _hover={{ bg: 'brand.slate.100' }}
                    colorScheme="purple"
                    name="memberType"
                    size="md"
                    value="MEMBER"
                  >
                    <Box ml={2}>
                      <Text fontSize="sm" fontWeight={700}>
                        成员
                      </Text>
                      <Text fontSize="sm">
                        成员可以管理赏金任务和定向任务，决定获胜者和支付奖励。
                      </Text>
                    </Box>
                  </Radio>
                  <Radio
                    mt={2}
                    _hover={{ bg: 'brand.slate.100' }}
                    colorScheme="purple"
                    name="memberType"
                    size="md"
                    value="ADMIN"
                  >
                    <Box ml={2}>
                      <Text fontSize="sm" fontWeight={700}>
                        管理员
                      </Text>
                      <Text fontSize="sm">
                        管理员有所有成员权限，并且可以管理所有成员。
                      </Text>
                    </Box>
                  </Radio>
                </RadioGroup>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button mr={4} onClick={onClose} variant="ghost">
                关闭
              </Button>
              <Button
                colorScheme="blue"
                isDisabled={!email}
                isLoading={inviteMutation.isPending}
                leftIcon={<AiOutlineSend />}
                loadingText=""
                onClick={sendInvites}
              >
                发送邀请
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
