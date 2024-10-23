import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

import { fontSize, maxW, padding } from '../utils';

const faqs = [
  {
    question: 'faqs.whoQualifies.question',
    answer: 'faqs.whoQualifies.answer',
  },
  {
    question: 'faqs.moneyNeeded.question',
    answer: 'faqs.moneyNeeded.answer',
  },
  {
    question: 'faqs.whoJudges.question',
    answer: 'faqs.whoJudges.answer',
  },
  {
    question: 'faqs.hiddenCosts.question',
    answer: 'faqs.hiddenCosts.answer',
  },
  {
    question: 'faqs.whatCanUse.question',
    answer: 'faqs.whatCanUse.answer',
  },
  {
    question: 'faqs.needHelp.question',
    answer: 'faqs.needHelp.answer',
  },
];

export function FAQs() {
  const { t } = useTranslation();

  return (
    <VStack w="full" pt="2rem" pb="4rem" bg="#EEF2FF" id="faqs">
      <Text
        pos="relative"
        w="full"
        color="brand.slate.800"
        fontSize={fontSize}
        fontWeight={600}
        textAlign="center"
      >
        {t('faqs.title')}
      </Text>
      <Accordion
        w="full"
        maxW={maxW}
        px={padding}
        allowToggle
        rounded="0.25rem"
      >
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.question}
            my="1rem"
            bg="white"
            border="0"
            rounded="0.25rem"
          >
            <h2>
              <AccordionButton
                py="0.8rem"
                _expanded={{ bg: 'blackAlpha.50' }}
                rounded="0.25rem"
              >
                <Box as="span" flex="1" textAlign="left">
                  {t(faq.question)}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel
              pb={4}
              dangerouslySetInnerHTML={{ __html: t(faq.answer) }}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </VStack>
  );
}
