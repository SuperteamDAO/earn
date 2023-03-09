import { Box, Button, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { BiDownArrowAlt, BiUpArrowAlt } from 'react-icons/bi';
import { MultiSelectOptions, skillSubSkillMap } from '../../../../constants';
import { SkillColor } from '../../../../utils/constants';

interface Props {
  skills: MultiSelectOptions[];
}

export const DetailDescription = ({ skills }: Props) => {
  const [show, setShow] = useState<boolean>(false);

  return (
    <>
      <VStack rounded={'xl'} p={5} bg={'white'}>
        <Flex w={'full'} justify={'space-between'}>
          <Text color={'#94A3B8'} fontWeight={500}>
            Skills Needed
          </Text>
          <HStack>
            {skills.map((e) => {
              return (
                <Box
                  bg={SkillColor[e.label as any] + '1A'}
                  key={e.value}
                  px={4}
                  py={1}
                  rounded={'md'}
                >
                  <Text fontSize={'0.8rem'} color={SkillColor[e.label as any]}>
                    {e.label}
                  </Text>
                </Box>
              );
            })}
          </HStack>
        </Flex>
        <Flex position={'relative'} flexDir={'column'}>
          <Flex
            h={show ? 'full' : '21.5rem'}
            overflow={'hidden'}
            flexDir={'column'}
            mt={10}
            pb={8}
          >
            Lorem ipsum dolor, sit amet consectetur adipisicing elit.
            Repellendus esse facere odit saepe nihil velit perspiciatis ea.
            Minima alias aperiam expedita culpa ipsam dolores itaque
            exercitationem, cum ad recusandae assumenda eius doloribus aut at
            temporibus neque aspernatur magnam ut perspiciatis aliquam libero
            omnis, ducimus, iste rem. Sunt debitis tempora in quas esse qui
            nesciunt quae cumque totam corporis sed dolorum, ad dolores quos
            ipsam inventore, obcaecati repudiandae saepe ullam at sint rem quam
            libero quod? Cupiditate quibusdam eius recusandae quisquam nam
            quibusdam. Consectetur vitae beatae quo obcaecati eum aliquid illum,
            itaque eaque tenetur aliquam amet culpa, modi quisquam. Ullam, hic
            quisquam quasi, blanditiis eum perspiciatis doloremque aliquid ad
            repellendus voluptate, nihil ratione! Quo, aperiam cupiditate.
            voluptate, Lorem ipsum dolor sit amet consectetur adipisicing elit.
            Porro praesentium eligendi consectetur officia ad veniam, eos ab
            ipsum architecto voluptates neque. Laudantium ipsum voluptatum neque
            tenetur enim vitae at quas numquam similique magnam quia minus
            accusamus quo, nesciunt voluptatibus molestias ipsam placeat error
            eos officia nemo. Reprehenderit iste, quibusdam, reiciendis in
            doloribus vitae aspernatur accusamus eius deleniti, et nam eaque
            itaque nihil! Veniam quasi labore assumenda dignissimos dolore
            impedit. Facere nobis a, excepturi ipsum voluptate blanditiis nihil
            at ullam, deserunt illum culpa rem cupiditate saepe explicabo? Ad
            labore alias dolore quos veritatis! Maxime dignissimos saepe aliquam
            placeat excepturi perspiciatis iure. Nihil fugiat nobis consectetur
            delectus aspernatur totam sint facilis consequatur maiores, aliquid
            porro quos voluptas laboriosam officiis temporibus deleniti ipsa ea
            culpa saepe fuga sed? Deleniti, voluptates. Earum ad sunt ducimus
            dolore harum! Necessitatibus tenetur quasi, dolores, vero
            distinctio, porro velit minima omnis nesciunt quam reiciendis
            consequatur sequi nisi corrupti fuga nulla praesentium magnam
            voluptas! Placeat quisquam vero sequi quod possimus id ipsa quam eum
            incidunt! Facilis vel illo quo soluta quia voluptates, inventore
            autem qui ea earum deleniti commodi. Necessitatibus delectus laborum
            labore reiciendis ad, eaque facilis quam ipsa eligendi voluptas ea
            ex odit harum deserunt fugiat reprehenderit consequuntur totam sunt
            repellat, quibusdam quia? Debitis, sunt provident doloremque
            laboriosam, cupiditate rerum amet quam cum adipisci voluptatem
            tempore possimus vero facere unde eos, optio perferendis at nisi? In
            architecto voluptates quidem! Maiores beatae, animi doloremque modi
            a eligendi sit praesentium, aliquam, repudiandae illum quasi.
            Excepturi ut doloribus ab vitae autem maxime repellat quibusdam
            ullam ex. Temporibus odio, itaque assumenda doloremque expedita
            corrupti deserunt laboriosam consequuntur! Beatae est, reiciendis
            rem voluptatem dolorem neque reprehenderit velit saepe eos explicabo
            nihil dolores fuga placeat adipisci. Enim minima fugiat dolorem
            eligendi dolores cupiditate tempora, aperiam aspernatur deserunt rem
            quam quas, qui aliquam temporibus hic numquam molestiae nulla
            ducimus repellendus voluptate beatae. Nesciunt quidem ad tenetur
            soluta et adipisci quisquam esse beatae blanditiis similique illo
            ipsum molestias laborum ullam aperiam quia ratione ab quam deserunt
            corporis voluptatem temporibus, dolores maxime! Iste, sunt?
            Architecto sunt saepe soluta reiciendis accusantium quidem
            blanditiis, inventore hic rem numquam. Reiciendis labore porro
            voluptatibus soluta dicta fugit cupiditate omnis vitae itaque,
            magnam possimus laudantium modi corporis, deserunt commodi!
            Asperiores commodi quasi sint possimus architecto eveniet, nemo
            voluptatem aliquam nihil tempore exercitationem officiis delectus
            magnam voluptates placeat! Facilis ratione non deleniti amet,
            debitis ex tempora modi excepturi. Laborum enim corporis earum id
            fugit, eos tenetur aspernatur repudiandae suscipit hic facilis iusto
            harum. Quidem illo exercitationem ipsam quaerat unde vero. Ex
            consequuntur magnam pariatur provident nesciunt in hic repellat
            quia, earum, saepe quod cupiditate voluptate sunt, explicabo ut
            repellendus magni libero blanditiis accusantium eius. Nihil
            provident mollitia ab nemo consequatur beatae excepturi vel nostrum,
            eaque ex quae pariatur ipsum quod molestias alias natus corrupti!
            Reiciendis earum, eligendi minima repudiandae expedita porro illo
            delectus quaerat officia quibusdam totam. Reiciendis nihil omnis
            laborum adipisci molestiae officiis repellendus magni ab
            exercitationem reprehenderit quisquam doloremque explicabo dolorem
            eligendi rem voluptatum consectetur illum error nobis, a beatae
            similique, non repudiandae voluptates! Saepe corporis quae dolorum
            odio est adipisci, voluptates ex exercitationem nemo aliquam
            reiciendis odit quisquam inventore quo fuga neque minima,
            dignissimos eaque! Id distinctio maxime iste sapiente quidem
            pariatur, a omnis? Reiciendis eaque iste quas obcaecati culpa
            repellendus optio! Fugiat fuga dolor enim officia praesentium, rerum
            voluptas provident, saepe iure unde eveniet, consectetur minus
            expedita nostrum deserunt voluptates quae perferendis eligendi?
            Nihil esse omnis natus velit modi eaque dignissimos tempora corporis
            sit totam, obcaecati, aliquam odio voluptate minima. Natus enim
            excepturi deserunt pariatur voluptatem a blanditiis at tenetur,
            libero illo atque nisi velit ad deleniti. Illum quo laudantium quia
            sequi accusantium itaque minus, temporibus cum? Dolores temporibus
            pariatur ex necessitatibus aliquam odit qui aut exercitationem
            maxime numquam perspiciatis quis nulla unde quaerat labore dicta
            placeat dignissimos ab, debitis reiciendis laborum itaque obcaecati
            officiis! Quo odit necessitatibus cumque molestiae fugiat ad beatae
            perferendis vero quisquam nulla repudiandae veniam, harum dolor
            exercitationem iste facilis provident assumenda aperiam corporis
            nemo a, molestias architecto quos? Neque quia odio quis omnis, nemo
            nostrum consequuntur eveniet ipsa consectetur ratione voluptas
            obcaecati rerum mollitia, similique excepturi rem sunt id!
            Distinctio corrupti provident adipisci laudantium blanditiis iure
            aspernatur molestias praesentium vitae, impedit atque! Incidunt amet
            voluptates fuga quidem molestiae natus obcaecati doloremque eum
            ipsum, ab soluta totam, a quam tempora accusamus est? Id qui
            laudantium eligendi ipsum veniam, maiores repellat reiciendis
            molestiae exercitationem maxime at, debitis autem quasi sed! Eveniet
            quas voluptatibus id architecto quae blanditiis dignissimos nam
            corrupti nihil accusamus est tenetur qui laudantium vitae placeat
            veritatis harum sed, consequuntur maxime sit. Sequi eaque neque
            ipsum illo omnis consectetur voluptate debitis saepe perferendis id
            ipsa sunt nostrum voluptatum quidem voluptates nulla deleniti
            dolorum, quis eligendi? Incidunt praesentium facilis aut et
            dignissimos voluptatum debitis, iste ipsa enim laudantium excepturi
            quisquam nisi alias unde velit quam error! Quae facilis totam
            placeat ab blanditiis explicabo, incidunt nam rem, voluptates
            pariatur accusamus recusandae nesciunt. Temporibus adipisci vel
            voluptatibus pariatur, et vero nesciunt provident debitis possimus,
            ad veniam corporis alias tempora asperiores ab fugiat sint
            dignissimos ducimus? Animi quaerat fugiat esse voluptatibus ad
            eveniet? Reprehenderit, commodi illum! Doloribus, minima. Quasi,
            dolorum incidunt? Ipsum cupiditate sed, laborum neque, ullam harum
            nisi nostrum maiores possimus optio mollitia ea rem vero sapiente
            veniam in ad eos perspiciatis non culpa inventore, placeat nemo
            amet. Quis reprehenderit blanditiis, ex et illum eligendi
            dignissimos, mollitia facilis tenetur ad magni odit doloribus
            impedit non consequatur? Veniam, incidunt quis, deserunt possimus
            dolores quod magnam perferendis quam illo accusantium nam voluptate?
            Quibusdam ex, vel delectus quia explicabo eligendi cupiditate illum
            omnis laboriosam, itaque accusantium aperiam cum cumque magni qui
            voluptates soluta animi nisi minus voluptate obcaecati dolores
            tempora ut. Dicta natus hic, enim incidunt assumenda, aut dolorum
            praesentium possimus odio dolore doloribus? Facilis nisi molestiae
            animi culpa explicabo? Voluptates fugiat eaque vel exercitationem
            ipsum fugit facilis voluptatem hic vero architecto reiciendis magni,
            aliquid esse velit numquam molestiae, ab minima qui facere pariatur,
            soluta atque? Illum culpa minus, voluptatem dolores non repudiandae
            tempore vitae, ipsam ea cum, reprehenderit possimus!
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
              show
                ? 'transparent'
                : 'linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.57) 100%)'
            }
          >
            <Button
              color={'#94A3B8'}
              fontSize={'1.1rem'}
              w={'12rem'}
              onClick={() => {
                setShow(!show);
              }}
              transform={'matrix(1, 0, 0, -1, 0, 0);'}
              boxShadow={'0px 4px 4px rgba(0, 0, 0, 0.06)'}
              bg={'#FFFFFF'}
              rounded={'2xl'}
            >
              {show ? (
                <>
                  <BiUpArrowAlt fontSize={'1.3rem'} />
                  <Text mx={3}>Read Less</Text>
                </>
              ) : (
                <>
                  <BiDownArrowAlt fontSize={'1.3rem'} />
                  <Text mx={3}>Read More</Text>
                </>
              )}
            </Button>
          </Box>
        </Flex>
      </VStack>
    </>
  );
};
