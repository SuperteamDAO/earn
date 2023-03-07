import { Box, Button, Flex, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { BiDownArrowAlt } from 'react-icons/bi';

export const DetailDescription = () => {
  return (
    <>
      <VStack rounded={'xl'} p={5} bg={'white'}>
        <Flex w={'full'} justify={'space-between'}>
          <Text color={'#94A3B8'} fontWeight={500}>
            Skills Needed
          </Text>
          <Text>sds</Text>
        </Flex>
        <Flex position={'relative'} flexDir={'column'}>
          <Flex flexDir={'column'} mt={10}>
            Lorem ipsum dolor, sit amet consectetur adipisicing elit.
            Repellendus esse facere odit saepe nihil velit perspiciatis ea.
            Minima alias aperiam expedita culpa ipsam dolores itaque
            exercitationem, cum ad recusandae assumenda eius doloribus aut at
            temporibus neque aspernatur magnam ut perspiciatis aliquam libero
            omnis, ducimus, iste rem. Sunt debitis tempora in quas esse qui
            nesciunt quae cumque totam corporis sed dolorum, ad dolores quos
            ipsam inventore, obcaecati repudiandae saepe ullam at sint rem quam
            libero quod? Cupiditate quibusdam eius
            <Text display={['none', 'none', 'block', 'block']}>
              Lorem ipsum dolor sit amet consectetur, adipisicing elit. Sit,
              dicta quasi vitae sed aut ut? Nesciunt nemo vel labore non vero
              eaque incidunt totam aspernatur consequatur recusandae perferendis
              reprehenderit dignissimos accusamus mollitia error, ut quasi.
              Accusamus, voluptas? Aperiam tenetur reprehenderit quod rem,
              ducimus placeat ut est minus laudantium aut totam obcaecati iure
              hic nihil, velit at? Dignissimos velit iure minus placeat
              accusantium esse recusandae quisquam nam quibusdam. Consectetur
              vitae beatae quo obcaecati eum aliquid illum, itaque eaque tenetur
              aliquam amet culpa, modi quisquam. Ullam, hic quisquam quasi,
              blanditiis eum perspiciatis doloremque aliquid ad repellendus
              voluptate, nihil ratione! Quo, aperiam cupiditate. voluptate,
            </Text>
          </Flex>
          <Box
            h={'50%'}
            position={'absolute'}
            bottom={0}
            display={'flex'}
            justifyContent={'center'}
            alignItems={'start'}
            w={'full'}
            transform={'matrix(1, 0, 0, -1, 0, 0);'}
            bg={
              'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.57) 100%)'
            }
          >
            <Button
              color={'#94A3B8'}
              fontSize={'1.1rem'}
              w={'12rem'}
              transform={'matrix(1, 0, 0, -1, 0, 0);'}
              boxShadow={'0px 4px 4px rgba(0, 0, 0, 0.06)'}
              bg={'#FFFFFF'}
              rounded={'2xl'}
            >
              <>
                <BiDownArrowAlt fontSize={'1.3rem'} />
                <Text mx={3}>Read More</Text>
              </>
            </Button>
          </Box>
        </Flex>
      </VStack>
    </>
  );
};
