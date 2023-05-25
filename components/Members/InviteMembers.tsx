import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import axios from 'axios';
import { useState } from 'react';
import { AiOutlineSend } from 'react-icons/ai';

import { userStore } from '@/store/user';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

function InviteMembers({ isOpen, onClose }: Props) {
  const { userInfo } = userStore();
  const [email, setEmail] = useState<string>();
  const [isInviting, setIsInviting] = useState(false);
  const [isInviteSuccess, setIsInviteSuccess] = useState(false);

  const handleInput = (emailString: string) => {
    const isEmail = validateEmail(emailString);
    if (isEmail) {
      setEmail(emailString);
    }
  };

  const sendInvites = async () => {
    setIsInviting(true);
    try {
      await axios.post('/api/members/invite', {
        email,
        userId: userInfo?.id,
      });
      setIsInviteSuccess(true);
      setIsInviting(false);
    } catch (e) {
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
              <Alert borderRadius="md" status="success" variant="subtle">
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
              <FormControl>
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
              </FormControl>
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

export default InviteMembers;
