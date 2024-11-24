import {
  Button,
  Center,
  Divider,
  HStack,
  Link,
  ListItem,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';

import { TERMS_OF_USE } from '@/constants';

export const SubmissionTerms = ({
  isOpen,
  onClose,
  sponsorName,
  entityName,
}: {
  isOpen: boolean;
  onClose: () => void;
  sponsorName: string;
  entityName?: string;
}) => {
  return (
    <Modal
      autoFocus={false}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent overflow="hidden" rounded="lg">
        <HStack gap={5} px={5} py={4}>
          <Center p={3} bg="brand.slate.200" rounded="full">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.9998 0.666748H2.99977C2.20412 0.666748 1.44106 0.982818 0.878451 1.54543C0.315841 2.10804 -0.000228882 2.8711 -0.000228882 3.66675V27.6667C-0.000228882 28.4624 0.315841 29.2255 0.878451 29.7881C1.44106 30.3507 2.20412 30.6667 2.99977 30.6667H20.9998C21.7954 30.6667 22.5585 30.3507 23.1211 29.7881C23.6837 29.2255 23.9998 28.4624 23.9998 27.6667V9.66675L14.9998 0.666748ZM20.9998 27.6667H2.99977V3.66675H13.4998V11.1667H20.9998V27.6667Z"
                fill="#4D55E4"
              />
            </svg>
          </Center>
          <Text align="start" fontSize="xl" fontWeight={600} lineHeight={1}>
            Terms of Use
          </Text>
        </HStack>
        <Divider borderBottomWidth={2} />
        <VStack
          align="start"
          gap={3}
          px={5}
          py={4}
          color="brand.slate.500"
          fontWeight={500}
          textAlign="left"
        >
          <UnorderedList>
            <ListItem>
              承诺您将作品或申请提交给
              {entityName ? `${entityName} ("${sponsorName}")` : sponsorName}.
            </ListItem>
            <ListItem>
              Solar Earn
              仅作为合作伙伴发布资助、悬赏任务、定向任务或类似活动的平台。{' '}
              {`("Activities")`} on its platform {`(“ST Earn Platform”)`}.
            </ListItem>
            <ListItem>
              Solar Earn shall not be liable for any Activities listed by the
              Partner on the ST Earn Platform. The Partner is solely responsible
              for the content, rules, scope and execution of their Activities.
            </ListItem>
            <ListItem>
              任何与合作伙伴在 Solar Earn
              平台上列出的活动相关的争议或问题都将直接负责。Solar Earn
              不负责解决此类争议。
            </ListItem>
            <ListItem>
              任何与合作伙伴在 Solar Earn
              平台上列出的活动相关的争议或问题都将直接负责。合作伙伴对其活动的内容、规则、范围和执行负全部责任。
            </ListItem>
            <ListItem>
              任何与合作伙伴在 Solar Earn
              平台上列出的活动相关的争议或问题都将直接负责。合作伙伴对其活动的内容、规则、范围和执行负全部责任。
            </ListItem>
            <ListItem>
              通过使用平台和参加任何活动，用户同意放弃对合作伙伴在 Solar Earn
              平台上列出的任何活动的任何索赔、责任或损失。
            </ListItem>
            <ListItem>
              Solar Earn
              不保证合作伙伴所列活动的准确性和合法性。建议用户在参加任何活动之前谨慎行事，并进行尽职调查。
            </ListItem>
            <ListItem>
              在平台上列出活动的合作伙伴同意赔偿 Solar Earn
              因其活动引起的任何索赔、损害或责任，并使其免受损害。
            </ListItem>
          </UnorderedList>
          <Text as={'p'} lineHeight={1.25}>
            这些条款是对我们的{' '}
            <Link
              textDecoration={'underline'}
              href={TERMS_OF_USE}
              rel="noopener noreferrer"
              target="_blank"
              textUnderlineOffset={2}
            >
              Terms of Use
            </Link>
            .
          </Text>
          <Button ml="auto" px={10} fontSize="lg" onClick={onClose}>
            的补充
          </Button>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
