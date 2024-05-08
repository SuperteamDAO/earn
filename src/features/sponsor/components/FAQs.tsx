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

import { fontSize, maxW, padding } from '../utils';

const faqs = [
  {
    question: 'Who qualifies to be a sponsor?',
    answer: `Any team or project that is building in the Solana ecosystem can sponsor a listing on Superteam Earn. Size of the team or operations don't matter — you can be a tokenised project or a small grantee; as long as you are building on the Solana blockchain, you can add a listing on Earn.`,
  },
  {
    question: 'How much money do I need to put up?',
    answer: `There is no upper or lower limit of the amount of money you need to put up per listing. However, the compensation offered per listing will affect the distribution (via emails, discord, platform discovery, etc.) that the listing will get.`,
  },
  {
    question: 'Who judges the bounties & projects?',
    answer: `The sponsors are supposed to review, announce, and pay out the winners on Superteam Earn. It's super simple to manage your submissions, all within Earn.`,
  },
  {
    question: 'Are there any hidden costs and charges?',
    answer: `None at all!`,
  },
  {
    question: 'What can I use Superteam Earn for?',
    answer: `Superteam Earn is a platform to get work done from crypto-native talent. This can be in the form of boutnies (get the same work done by many people) or hiring freelancers in the form of Project listings.
<br />
Earn can be used to get any small to medium scale task done, including but not limited to development, writing, design, research, and product feedback.
<br />
<a style="color: blue" href="https://in.superteam.fun/bounty-menu" target="_blank" >Click here</a> to access the Listings Menu, which contains ideas, listing examples, suggested prize ranges, etc.`,
  },
  {
    question: 'I need help with my listing. How can I get in touch?',
    answer: `You can get in touch with us at <a style="color: blue" href="mailto:hello@superteamearn.com" target="_blank">hello@superteamearn.com</a> and we will get back to you ASAP.`,
  },
];

export function FAQs() {
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
        FAQs
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
                  {faq.question}
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel
              pb={4}
              dangerouslySetInnerHTML={{ __html: faq.answer }}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </VStack>
  );
}
