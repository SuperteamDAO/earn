import React, {
  Dispatch,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import Code from '@editorjs/code';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import CheckList from '@editorjs/checklist';
import CodeBox from '@bomdi/codebox';
import Delimiter from '@editorjs/delimiter';
import Embed from '@editorjs/embed';
import InlineCode from '@editorjs/inline-code';
import LinkTool from '@editorjs/link';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import EditorJS, { OutputData } from '@editorjs/editorjs';
import { Box, Button, VStack } from '@chakra-ui/react';

interface Props {
  setEditorData: Dispatch<SetStateAction<OutputData | undefined>>;
  editorData: OutputData | undefined;
  setSteps: Dispatch<SetStateAction<number>>;
  createDraft: (payment: string) => void;
}
const Description = ({
  editorData,
  setEditorData,
  setSteps,
  createDraft,
}: Props) => {
  const ref = useRef<EditorJS>();
  const initializeEditor = () => {
    const editor = new EditorJS({
      holder: 'editorjs',
      data: editorData,
      onReady: () => {
        ref.current = editor as any;
      },
      autofocus: true,
      tools: {
        code: Code,
        header: Header,
        paragraph: Paragraph,
        embed: Embed,
        list: List,
        codeBox: CodeBox,
        linkTool: LinkTool,
        quote: Quote,
        checklist: CheckList,
        delimiter: Delimiter,
        inlineCode: InlineCode,
      },

      //   inlineToolbar: true,
      inlineToolbar: true,
      hideToolbar: false,
    });
    ref.current = editor;
  };
  useEffect(() => {
    if (!ref.current) {
      initializeEditor();
    }
    return () => {
      if (ref.current && ref.current.destroy) {
        ref.current.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <VStack
        border={'1px solid #cbd5e1'}
        borderRadius={'10px'}
        p={4}
        h={'35rem'}
        my={10}
        w={'3xl'}
      >
        <Box w="full" id="editorjs"></Box>
      </VStack>
      <VStack w={'2xl'} gap={6} h={'10rem'} my={10}>
        <Button
          w="100%"
          bg={'#6562FF'}
          _hover={{ bg: '#6562FF' }}
          color={'white'}
          fontSize="1rem"
          fontWeight={600}
          onClick={async () => {
            console.log(typeof ref.current);

            if (!ref.current) return;
            const data = await ref.current?.save();
            setEditorData(data);
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
