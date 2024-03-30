import { DeleteIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormLabel,
  HStack,
  Image,
  Input,
  Link as ChakraLink,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  Tooltip,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { Color } from '@tiptap/extension-color';
import ImageUpload from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import imageCompression from 'browser-image-compression';
import React, {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from 'react';
import toast from 'react-hot-toast';
import { AiOutlineLink, AiOutlineOrderedList } from 'react-icons/ai';
import { BiFontColor } from 'react-icons/bi';
import {
  BsBlockquoteLeft,
  BsCodeSlash,
  BsFileBreak,
  BsTypeItalic,
} from 'react-icons/bs';
import { CiRedo, CiUndo } from 'react-icons/ci';
import { GoBold } from 'react-icons/go';
import {
  MdOutlineAddPhotoAlternate,
  MdOutlineFormatListBulleted,
  MdOutlineFormatUnderlined,
  MdOutlineHorizontalRule,
} from 'react-icons/md';
import ImageResize from 'tiptap-extension-resize-image';

import { ReferenceCard, type References } from '@/features/listings';
import { uploadToCloudinary } from '@/utils/upload';

const LinkModal = ({
  isOpen,
  onClose,
  setLink,
}: {
  isOpen: boolean;
  onClose: () => void;
  setLink: (link: string) => void;
}) => {
  const [linkUrl, setLinkUrl] = useState<string>('');
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody my={5}>
            <Input
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="add a link"
            />
            <HStack justify={'end'} w={'full'} mt={5}>
              <Button mr={4} onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button onClick={() => setLink(linkUrl)} variant="solid">
                Submit
              </Button>
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
  createDraft: () => void;
  draftLoading?: boolean;
  editable?: boolean;
  setBountyRequirements?: Dispatch<SetStateAction<any | undefined>>;
  bountyRequirements?: string | undefined;
  type?: 'bounty' | 'project' | 'hackathon';
  references?: References[];
  setReferences?: Dispatch<SetStateAction<References[]>>;
  isNewOrDraft?: boolean;
  isDuplicating?: boolean;
}

export const DescriptionBuilder = ({
  editorData,
  setEditorData,
  setSteps,
  createDraft,
  draftLoading,
  bountyRequirements,
  setBountyRequirements,
  references,
  setReferences,
  type,
  isNewOrDraft,
  isDuplicating,
}: Props) => {
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [referenceError, setReferenceError] = useState<boolean>(false);
  const editor = useEditor({
    extensions: [
      Underline,
      ImageResize,
      ImageUpload.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'align-item:center',
        },
      }),
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      TextStyle.configure(),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Give more details about the Listing...',
        showOnlyWhenEditable: false,
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

  const setLink = useCallback(
    (url: string) => {
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

      // update link
      editor
        ?.chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
      onClose();
    },
    [editor],
  );

  const addImage = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg, image/png'; // Accept only JPEG & PNG files
    fileInput.click();

    // Listen for file selection
    fileInput.addEventListener('change', async (event: any) => {
      const file = event?.target?.files[0];
      if (file) {
        const toastId = toast.loading('Uploading image...');

        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          };
          const compressedImg = await imageCompression(file, options);

          // upload the file and get its URL
          const url = await uploadToCloudinary(compressedImg);
          if (url) {
            // Set the image in the editor
            editor?.chain().focus().setImage({ src: url }).run();
            toast.success('Image uploaded successfully!', { id: toastId });
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image.', { id: toastId });
        }
      }
    });
  }, [editor]);

  const handleDeleteReference = () => {
    if (references && setReferences) {
      const temp = references.filter(
        (_el, index) => index !== references.length - 1,
      );
      setReferences(temp);
    }
  };

  const isProject = type === 'project';

  const [editorError, setEditorError] = useState(false);

  return (
    <>
      {isOpen && (
        <LinkModal setLink={setLink} isOpen={isOpen} onClose={onClose} />
      )}
      <Box>
        <Box mb={8}>
          <Flex justify="start" w="full">
            <Flex>
              <FormLabel
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                Eligibility Requirements
              </FormLabel>
              <Tooltip
                w="max"
                p="0.7rem"
                color="white"
                fontSize="0.9rem"
                fontWeight={600}
                bg="#6562FF"
                borderRadius="0.5rem"
                hasArrow
                label={`Add here if you have any specific eligibility requirements for the Listing.`}
                placement="right-end"
              >
                <Image
                  mt={-2}
                  alt={'Info Icon'}
                  src={'/assets/icons/info-icon.svg'}
                />
              </Tooltip>
            </Flex>
          </Flex>
          <Input
            w={'full'}
            color={'brand.slate.500'}
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            id="bountyRequirements"
            maxLength={220}
            onChange={(e) =>
              setBountyRequirements && setBountyRequirements(e.target.value)
            }
            placeholder="Add Eligibility Requirements"
            type={'text'}
            value={bountyRequirements}
          />
          <Text
            color={
              (bountyRequirements?.length || 0) > 200
                ? 'red'
                : 'brand.slate.400'
            }
            fontSize={'xs'}
            textAlign="right"
          >
            {220 - (bountyRequirements?.length || 0)} characters left
          </Text>
        </Box>
        <Flex justify="space-between" w="full">
          <Flex>
            <FormLabel
              color={'brand.slate.500'}
              fontSize={'15px'}
              fontWeight={600}
            >
              Listing Details
            </FormLabel>
            <Text
              as="sup"
              mt={3.5}
              mr={3}
              ml={-2}
              color="#e53e3e"
              fontWeight={600}
            >
              *
            </Text>
            <Tooltip
              w="max"
              p="0.7rem"
              color="white"
              fontSize="0.9rem"
              fontWeight={600}
              bg="#6562FF"
              borderRadius="0.5rem"
              hasArrow
              label={`Write details about the Listing - About, Requirements, Evaluation Criteria, Resources, Rewards, etc.`}
              placement="right-end"
            >
              <Image
                mt={-2}
                alt={'Info Icon'}
                src={'/assets/icons/info-icon.svg'}
              />
            </Tooltip>
          </Flex>
          <ChakraLink
            gap={1}
            display="flex"
            color="brand.slate.400"
            fontSize={'13px'}
            _hover={{
              textDecoration: 'none',
              color: 'brand.slate.500',
            }}
            href="https://chat.openai.com/g/g-HS6eWTMku-st-earn-listings-bot"
            target="_blank"
          >
            <Text textDecoration="none">🤖</Text>
            <Text textDecoration="underline" textUnderlineOffset={2}>
              Go live in {'<1'} min by using our drafting bot (ChatGPT 4
              Required)
            </Text>
          </ChakraLink>
        </Flex>
        <VStack w={'min-content'} mb={8}>
          <Flex
            pos={'sticky'}
            zIndex="200"
            top="14"
            align={'center'}
            justify={'start'}
            w={'full'}
            borderBottom={'1px solid #D2D2D2'}
            bgColor={'#ffffff'}
          >
            <Button
              bg={editor?.isActive('heading', { level: 1 }) ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderLeft={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 1 }).run();
              }}
              variant={'unstyled'}
            >
              H1
            </Button>
            <Button
              bg={editor?.isActive('heading', { level: 2 }) ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 2 }).run();
              }}
              variant={'unstyled'}
            >
              H2
            </Button>
            <Button
              bg={editor?.isActive('heading', { level: 3 }) ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 3 }).run();
              }}
              variant={'unstyled'}
            >
              H3
            </Button>
            <Button
              bg={editor?.isActive('heading', { level: 4 }) ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 4 }).run();
              }}
              variant={'unstyled'}
            >
              H4
            </Button>
            <Button
              bg={editor?.isActive('heading', { level: 5 }) ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 5 }).run();
              }}
              variant={'unstyled'}
            >
              H5
            </Button>
            <Button
              bg={editor?.isActive('heading', { level: 6 }) ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleHeading({ level: 6 }).run();
              }}
              variant={'unstyled'}
            >
              H6
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('bold') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleBold().run();
              }}
              variant={'unstyled'}
            >
              <GoBold />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('italic') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleItalic().run();
              }}
              variant={'unstyled'}
            >
              <BsTypeItalic />
            </Button>{' '}
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('underline') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleUnderline().run();
              }}
              variant={'unstyled'}
            >
              <MdOutlineFormatUnderlined />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('underline') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={addImage}
              variant={'unstyled'}
            >
              <MdOutlineAddPhotoAlternate />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('link') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                onOpen();
              }}
              variant={'unstyled'}
            >
              <AiOutlineLink />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('bulletList') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleBulletList().run();
              }}
              variant={'unstyled'}
            >
              <MdOutlineFormatListBulleted />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('orderedList') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleOrderedList().run();
              }}
              variant={'unstyled'}
            >
              <AiOutlineOrderedList />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('codeBlock') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleCodeBlock().run();
              }}
              variant={'unstyled'}
            >
              <BsCodeSlash />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              bg={editor?.isActive('blockquote') ? 'gray.200' : ''}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().toggleBlockquote().run();
              }}
              variant={'unstyled'}
            >
              <BsBlockquoteLeft />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().setHorizontalRule().run();
              }}
              variant={'unstyled'}
            >
              <MdOutlineHorizontalRule />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().setHardBreak().run();
              }}
              variant={'unstyled'}
            >
              <BsFileBreak />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().undo().run();
              }}
              variant={'unstyled'}
            >
              <CiUndo />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {
                editor?.chain().focus().redo().run();
              }}
              variant={'unstyled'}
            >
              <CiRedo />
            </Button>
            <Button
              alignItems={'center'}
              justifyContent={'center'}
              display={'flex'}
              borderTop={'1px solid #D2D2D2'}
              borderRight={'1px solid #D2D2D2'}
              borderRadius={'0px'}
              onClick={() => {}}
              variant={'unstyled'}
            >
              <BiFontColor />
            </Button>
          </Flex>

          <Box w={'full'} h={'full'} mb={10}>
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
          {isProject && (
            <>
              <Flex
                align={'start'}
                justify={'start'}
                direction={'column'}
                w="100%"
                mb={3}
              >
                <Text
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                >
                  Deliverable References
                </Text>
                <Text
                  mt={'0px !important'}
                  color={'#94A3B8'}
                  fontSize={'0.88rem'}
                >
                  Add links of other projects/websites as references for the
                  kind of deliverables you are looking for.
                </Text>
              </Flex>
              {setReferences &&
                references?.map((reference, index) => {
                  return (
                    <Flex key={index} align="end" justify="space-end" w="full">
                      <ReferenceCard
                        setReferenceError={setReferenceError}
                        index={index}
                        curentReference={reference}
                        setReferences={setReferences}
                      />
                      {index === references.length - 1 && (
                        <Button ml={4} onClick={() => handleDeleteReference()}>
                          <DeleteIcon />
                        </Button>
                      )}
                    </Flex>
                  );
                })}
              {references && setReferences && references.length < 6 && (
                <Button
                  w={'full'}
                  h={12}
                  mt={2}
                  color={'#64758B'}
                  bg={'#F1F5F9'}
                  onClick={() => {
                    setReferences([
                      ...references,
                      {
                        order: (references?.length || 0) + 1,
                        link: '',
                      },
                    ]);
                  }}
                >
                  + Add Reference
                </Button>
              )}
            </>
          )}
        </VStack>
        <VStack gap={4} w={'full'} mt={16}>
          {editorError && (
            <Text align={'center'} color={'red'}>
              Listing Details is a required field
            </Text>
          )}
          <Button
            w="100%"
            onClick={() => {
              if (referenceError) {
                return;
              }
              if (editor?.isEmpty) {
                setEditorError(true);
                return;
              }
              if (!isProject) {
                setSteps(5);
                return;
              }
              setSteps(4);
            }}
            variant="solid"
          >
            Continue
          </Button>
          <Button
            w="100%"
            isDisabled={!editorData}
            isLoading={draftLoading}
            onClick={() => createDraft()}
            variant="outline"
          >
            {isNewOrDraft || isDuplicating ? 'Save Draft' : 'Update Listing'}
          </Button>
        </VStack>
      </Box>
    </>
  );
};
