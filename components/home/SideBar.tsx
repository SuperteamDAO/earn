import { Avatar, AvatarGroup, Box, Button, Flex, Text, Image, VStack, Center, Checkbox } from '@chakra-ui/react';

const SideBar = () => {
    return (
        <Flex flexDirection={"column"} w={"354px"} borderLeft={"1px solid #F1F5F9"} ml={"24px"} pt={"1.5rem"} pl={"20px"} rowGap={"40px"} pb={"100px"}>
            <NewToEarn />
            <GettingStarted />
            <TotalStats />
            <AlphaAccess />
            <RecentEarners />
            <HiringNow />
            <Featured />
            <Filter title={'FILTER BY INDUSTRY'} entries={['Gaming', 'Payments', 'Consumer', 'Infrastructure', 'DAOs']} />
            <Filter title={'FILTER BY INDUSTRY'} entries={['Bounties', 'Jobs', 'Grants']} />
        </Flex>
    )
}

export default SideBar

const Step = ({ number, isComplete }: { number: number, isComplete: boolean }) => {

    if (isComplete) {
        return (
            <Center zIndex={"200"} h={"38px"} w={"38px"} bg={"#6366F1"} rounded={"full"} >
                <Image w={"20px"} h={"20px"} src='/assets/icons/white-tick.svg' alt='' />
            </Center>
        )
    }

    return (
        <Center zIndex={"200"} bg={"#FFFFFF"} color={"#94A3B8"} h={"38px"} w={"38px"} border={"1px solid #94A3B8"} rounded={"full"}>
            {number}
        </Center>
    )
}

const GettingStarted = () => {
    return (
        <Box>
            <Text mb={"24px"} color={"#94A3B8"}>GETTING STARTED</Text>
            <Flex h={"200px"}>
                <VStack h={"100%"} position={"relative"} justifyContent={"space-between"} mr={"13px"}>
                    <Step number={1} isComplete={true} />
                    <Step number={2} isComplete={false} />
                    <Step number={3} isComplete={false} />
                    <Flex w={"1px"} h={"90%"} position={"absolute"} bg={"#CBD5E1"} />
                </VStack>
                <VStack h={"100%"} position={"relative"} justifyContent={"space-between"}>
                    <Box>
                        <Text color={"black"} fontSize={"14px"}>Create your account</Text>
                        <Text fontSize={"13px"} color={"#64748B"}>and get personalized notifications</Text>
                    </Box>
                    <Box>
                        <Text color={"black"} fontSize={"14px"}>Complete your profile</Text>
                        <Text fontSize={"13px"} color={"#64748B"}>and get seen by hiring managers</Text>
                    </Box>
                    <Box>
                        <Text color={"black"} fontSize={"14px"}>Win a bounty</Text>
                        <Text fontSize={"13px"} color={"#64748B"}>and get your Proof-of-Work NFT</Text>
                    </Box>
                </VStack>
            </Flex>
        </Box>
    )
}

const TotalStats = () => {
    return (
        <Flex px={"8px"} h={"69"} bg={"#F8FAFC"} rounded={"md"} alignItems={"center"} justifyContent={"space-between"}>
            <Flex>
                <Image h={"25px"} alt='' src='assets/icons/lite-purple-dollar.svg' mr={"8px"} mb={"auto"} />
                <Box>
                    <Text fontWeight={"600"} color={"black"} fontSize={"14px"}>$1,340,403 USD</Text>
                    <Text fontWeight={"400"} color={"#64748B"} fontSize={"12px"}>Community Earnings</Text>
                </Box>
            </Flex>
            <Box w={"1px"} h={"50%"} bg={"#CBD5E1"}>

            </Box>
            <Flex>
                <Image h={"25x"} alt='' src='assets/icons/lite-purple-suitcase.svg' mr={"8px"} mb={"auto"} />
                <Box>
                    <Text fontWeight={"600"} color={"black"} fontSize={"14px"}>293</Text>
                    <Text fontWeight={"400"} color={"#64748B"} fontSize={"12px"}>Listed Opportunities</Text>
                </Box>
            </Flex>
        </Flex>
    )
}

const Earner = () => {
    return (
        <Flex align={"center"} w={"100%"}>
            <Image mr={"17px"} w={"34px"} h={"34px"} rounded={"full"} src='https://bit.ly/kent-c-dodds' alt='' />
            <Box>
                <Text fontWeight={"500"} color={"black"} fontSize={"13px"}>
                    Madhur Dixit
                </Text>
                <Text color={"#64748B"} fontSize={"13px"}>
                    won Underdog Smart...
                </Text>
            </Box>
            <Flex columnGap={"5px"} ml={"auto"}>
                <Image src='/assets/landingsponsor/icons/usdc.svg' alt='' />
                <Text>
                    $3,000
                </Text>
            </Flex>

        </Flex>
    )
}


const RecentEarners = () => {
    return (
        <Box>
            <Text mb={"24px"} color={"#94A3B8"}>RECENT EARNERS</Text>
            <VStack rowGap={"29px"}>
                <Earner />
                <Earner />
                <Earner />
                <Earner />
                <Earner />
            </VStack>
        </Box>

    )
}

const Hiring = () => {
    return (
        <Flex align={"center"} w={"100%"}>
            <Image mr={"17px"} w={"34px"} h={"34px"} rounded={"md"} src='/assets/home/placeholder/ph2.png' alt='' />
            <Box>
                <Text fontWeight={"500"} color={"black"} fontSize={"13px"}>
                    Product Manager
                </Text>
                <Text color={"#64748B"} fontSize={"13px"}>
                    Formfunction, Remote, Full-time
                </Text>
            </Box>
        </Flex>
    )
}

const HiringNow = () => {
    return (
        <Box>
            <Text mb={"24px"} color={"#94A3B8"}>HIRING NOW</Text>
            <VStack rowGap={"29px"}>
                <Hiring />
                <Hiring />
                <Hiring />
                <Hiring />
                <Hiring />
            </VStack>
        </Box>
    )
}

const Featuring = () => {
    return (
        <Flex align={"center"} w={"100%"}>
            <Image mr={"17px"} w={"34px"} h={"34px"} rounded={"full"} src='https://bit.ly/kent-c-dodds' alt='' />
            <Box>
                <Text fontWeight={"500"} color={"black"} fontSize={"13px"}>
                    Madhur Dixit
                </Text>
                <Text color={"#64748B"} fontSize={"13px"}>
                    won Underdog Smart...
                </Text>
            </Box>
            <Flex columnGap={"5px"} ml={"auto"}>
                <Text fontSize={"14px"} color={"#3B82F6"}>
                    View
                </Text>
            </Flex>

        </Flex>
    )
}


const Featured = () => {
    return (
        <Box>
            <Text mb={"24px"} color={"#94A3B8"}>FEATURED</Text>
            <VStack rowGap={"29px"}>
                <Featuring />
                <Featuring />
                <Featuring />
                <Featuring />
                <Featuring />
            </VStack>
        </Box>

    )
}

const AlphaAccess = () => {
    return (
        <Flex direction={"column"} py={"14px"} px={"25px"} rounded={"lg"} w={"354px"} h={"228px"} bg={"url('/assets/home/display/grizzly.png')"}>
            <Text color={"white"} fontWeight={"600"} fontSize={"20px"} mt={"auto"}>
                Want Early Access to Projects?
            </Text>
            <Text lineHeight={"19px"} fontSize={"16px"} color={"white"} mt={"8px"}>
                Get exclusive early access to the latest Solana projects and win product feedback bounties, for free.
            </Text>
            <Button fontWeight={"500"} py={"13px"} bg={"#FFFFFF"} mt={"25px"}>
                Join the Alpha Squad
            </Button>
        </Flex>
    )
}

const NewToEarn = () => {
    return (
        <Box w={"354px"} bg={"#F8FAFC"} rounded={"md"} p={"16px"}>
            <Image w={"22px"} h={"22px"} alt='' src={"assets/home/emojis/wave.png"} />
            <Text mt={"10px"} fontSize={"16px"} fontWeight={"600"}>New to Earn?</Text>
            <Text mt={"5px"} color={"#64748B"} fontWeight={"500"}>Our only goal is to help you earn more crypto, faster. </Text>
            <Button fontSize={"12px"} fontWeight={"500"} mt={"11px"} w={"100%"}>Read the Beginner’s Guide</Button>
        </Box>
    )
}

const FilterEntry = ({ label }: { label: string }) => {
    return <Flex justifyContent={"space-between"}>
        <Checkbox size='md' colorScheme='blue' defaultChecked>
            <Text color={"#64748B"} fontSize={"14px"} ml={"10px"}>{label}</Text>
        </Checkbox>
        <Text color={"#64748B"} fontSize={"14px"} ml={"10px"}>{1234}</Text>
    </Flex>
}

const Filter = ({ title, entries }: { title: string, entries: string[] }) => {
    return (
        <Box>
            <Text mb={"24px"} color={"#94A3B8"}>{title}</Text>
            <Flex flexDirection={"column"} rowGap={"16px"}>
                {
                    entries.map((ele) => {
                        return (
                            <FilterEntry key={"fil" + ele} label={ele} />
                        )
                    })
                }
            </Flex>
        </Box >
    )
}