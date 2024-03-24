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
import axios from 'axios';
import { useState } from 'react';
import { AiOutlineSend } from 'react-icons/ai';

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
  const [email, setEmail] = useState<string>();
  const [memberType, setMemberType] = useState<string>('MEMBER');
  const [isInviting, setIsInviting] = useState(false);
  const [isInviteSuccess, setIsInviteSuccess] = useState(false);
  const [isInviteError, setIsInviteError] = useState(false);

  const handleInput = (emailString: string) => {
    setIsInviteError(false);
    const isEmail = validateEmail(emailString);
    if (isEmail) {
      setEmail(emailString);
    }
  };

  const sendInvites = async () => {
    setIsInviting(true);
    setIsInviteError(false);
    try {
      await axios.post('/api/members/invite/', {
        email,
        memberType,
      });
      setIsInviteSuccess(true);
      setIsInviting(false);
    } catch (e) {
      setIsInviteError(true);
      setIsInviting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Invite Member</ModalHeader>
        <ModalCloseButton />
        {isInviteSuccess ? (
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
                  <AlertTitle>Sent Invite!</AlertTitle>
                  <AlertDescription>
                    Your team member will receive an email with a link to join
                    Superteam Earn.
                  </AlertDescription>
                </Box>
              </Alert>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} variant="solid">
                Close
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalBody>
              <FormControl isInvalid={isInviteError}>
                <FormLabel mb={0}>Add Email Address</FormLabel>
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
                <FormLabel mb={0}>Member Type</FormLabel>
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
                        Member
                      </Text>
                      <Text fontSize="sm">
                        Members can manage bounties & projects, can assign
                        winners and make payments.
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
                        Admin
                      </Text>
                      <Text fontSize="sm">
                        Admin have all Member privileges, and they can manage
                        all members.
                      </Text>
                    </Box>
                  </Radio>
                </RadioGroup>
              </Stack>
            </ModalBody>
            <ModalFooter>
              <Button mr={4} onClick={onClose} variant="ghost">
                Close
              </Button>
              <Button
                colorScheme="blue"
                isDisabled={!email}
                isLoading={isInviting}
                leftIcon={<AiOutlineSend />}
                loadingText="Inviting..."
                onClick={() => sendInvites()}
              >
                Send Invite
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
