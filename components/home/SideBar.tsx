import { Avatar, AvatarGroup, Box, Button, Flex, Text, Image, VStack, Center } from '@chakra-ui/react';

const SideBar = () => {
    return (
        <Box w={"354px"} borderLeft={"1px solid #F1F5F9"} ml={"24px"} pt={"1.5rem"} pl={"20px"}>
            <GettingStarted />
        </Box>
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