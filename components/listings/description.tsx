import React, { useState, Dispatch, SetStateAction, useCallback } from 'react';
import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import StarterKit from '@tiptap/starter-kit';
import { useEditor, EditorContent } from '@tiptap/react';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import parse from 'html-react-parser';
import Underline from '@tiptap/extension-underline';
import { GoBold } from 'react-icons/go';
import {
  BsBlockquoteLeft,
  BsCodeSlash,
  BsFileBreak,
  BsTypeItalic,
} from 'react-icons/bs';
import {
  AiOutlineLink,
  AiOutlineOrderedList,
  AiOutlineStrikethrough,
} from 'react-icons/ai';
import { BiFontColor } from 'react-icons/bi';
import {
  MdOutlineFormatListBulleted,
  MdOutlineFormatUnderlined,
  MdOutlineHorizontalRule,
} from 'react-icons/md';
import { CiRedo, CiUndo } from 'react-icons/ci';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';
import { BountyBasicType } from './bounty/Createbounty';

const LinkModal = ({
  isOpen,
  onClose,
  setUrl,
  setLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  setUrl: Dispatch<SetStateAction<string>>;
  setLink: () => void;
}) => {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody my={5}>
            <Input
              placeholder="add a link"
              onChange={(e) => {
                setUrl(e.target.value);
              }}
            />
            <HStack mt={5} w={'full'} justify={'end'}>
              <Button onClick={setLink}>Submit</Button>
              <Button onClick={onClose}>Cancel</Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

interface Props {
  setEditorData: Dispatch<SetStateAction<string | undefined>>;
  editorData: string | undefined;
  setSteps: Dispatch<SetStateAction<number>>;
  createDraft: (payment: string) => void;
  bountyBasics?: BountyBasicType;
}
const Description = ({
  editorData,
  setEditorData,
  setSteps,
  createDraft,
  bountyBasics,
}: Props) => {
  const [url, setUrl] = useState<string>('');
  const router = useRouter();
  const editor = useEditor({
    extensions: [
      Underline,
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      TextStyle.configure(),
      Link.configure({
        openOnClick: false,
      }),
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
    ],
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setEditorData(html);
    },
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl m-5 focus:outline-none',
      },
    },
    content: editorData,
  });

  const setLink = useCallback(() => {
    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      onClose();
      return;
    }
    console.log(url);

    // update link
    editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: url })
      .run();
    onClose();
  }, [editor]);
  const { isOpen, onClose, onOpen } = useDisclosure();
  return (
    <>
      {isOpen && (
        <LinkModal
          setLink={setLink}
          isOpen={isOpen}
          onClose={onClose}
          setUrl={setUrl}
        />
      )}
      <VStack
        mt={10}
        mx={'auto'}
        h={'50rem !impotant'}
        minH={'50rem'}
        w={'3xl'}
      >
        <Flex
          w={'full'}
          align={'center'}
          justify={'start'}
          borderBottom={'1px solid #D2D2D2'}
        >
          <Button
            borderLeft={'1px solid #D2D2D2'}
            variant={'unstyled'}
            borderRadius={'0px'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('heading', { level: 1 }) ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 1 }).run();
            }}
          >
            H1
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('heading', { level: 2 }) ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 2 }).run();
            }}
          >
            H2
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('heading', { level: 3 }) ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 3 }).run();
            }}
          >
            H3
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('heading', { level: 4 }) ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 4 }).run();
            }}
          >
            H4
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('heading', { level: 5 }) ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 5 }).run();
            }}
          >
            H5
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('heading', { level: 6 }) ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleHeading({ level: 6 }).run();
            }}
          >
            H6
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('bold') ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleBold().run();
            }}
          >
            <GoBold />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('italic') ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleItalic().run();
            }}
          >
            <BsTypeItalic />
          </Button>{' '}
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('underline') ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleUnderline().run();
            }}
          >
            <MdOutlineFormatUnderlined />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('link') ? 'gray.200' : ''}
            onClick={() => {
              onOpen();
            }}
          >
            <AiOutlineLink />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('bulletList') ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleBulletList().run();
            }}
          >
            <MdOutlineFormatListBulleted />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('orderedList') ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleOrderedList().run();
            }}
          >
            <AiOutlineOrderedList />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('codeBlock') ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleCodeBlock().run();
            }}
          >
            <BsCodeSlash />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            bg={editor?.isActive('blockquote') ? 'gray.200' : ''}
            onClick={() => {
              editor?.chain().focus().toggleBlockquote().run();
            }}
          >
            <BsBlockquoteLeft />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            onClick={() => {
              editor?.chain().focus().setHorizontalRule().run();
            }}
          >
            <MdOutlineHorizontalRule />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            onClick={() => {
              editor?.chain().focus().setHardBreak().run();
            }}
          >
            <BsFileBreak />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            w={'full'}
            onClick={() => {
              editor?.chain().focus().undo().run();
            }}
          >
            <CiUndo />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            w={'full'}
            onClick={() => {
              editor?.chain().focus().redo().run();
            }}
          >
            <CiRedo />
          </Button>
          <Button
            variant={'unstyled'}
            borderRadius={'0px'}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'center'}
            borderTop={'1px solid #D2D2D2'}
            borderRight={'1px solid #D2D2D2'}
            onClick={() => {}}
            w={'full'}
          >
            <BiFontColor />
          </Button>
        </Flex>

        <Box w={'full'} height={'full'}>
          <div style={{ height: '100% !important' }} className="reset">
            <EditorContent
              id="reset-des"
              style={{}}
              width={'100%'}
              height={'100%'}
              editor={editor}
            />
          </div>
        </Box>
      </VStack>
      <VStack w={'2xl'} gap={6} h={'10rem'} my={7}>
        <Button
          w="100%"
          bg={'#6562FF'}
          _hover={{ bg: '#6562FF' }}
          color={'white'}
          fontSize="1rem"
          fontWeight={600}
          onClick={() => {
            if ((editorData?.length as number) > 5000) {
              toast.error('Max length for description is 4,500 characters');
              return;
            }
            if (
              router.query.type === 'bounties' &&
              bountyBasics &&
              bountyBasics.eligibility === 'premission-less'
            ) {
              setSteps(5);
              return;
            }
            setSteps(4);
          }}
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
          onClick={() => {
            createDraft('nothing');
          }}
        >
          Save as Drafts
        </Button>
      </VStack>
    </>
  );
};
export default Description;
