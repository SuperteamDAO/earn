import { Avatar, AvatarGroup, Box, Button, Flex, Text } from '@chakra-ui/react';
let slate = "#1E293B"

export default function Banner() {
    return <Box px={"42px"} py={"34px"} w={"737px"} h={"236px"} rounded={"md"} mt={"1.5rem"} bgImage="url('/assets/home/display/money_banner.png')" bgSize={"contain"}>
        <Text lineHeight={"30px"} color={slate} fontFamily={"Domine"} fontWeight={"700"} fontSize={"26px"}>
            Unlock Your Earning <br />
            Potential on Solana
        </Text>
        <Text w={"60%"} mt={"7px"} color={slate}>
            Explore bounties, grants, and job opportunities for developers and non-technical talent alike
        </Text>
        <Flex mt={"25px"} alignItems={"center"}>
            <Button bg={"#6366F1"} color={"white"} fontSize={"14px"} px={"36px"} py={"12px"}>
                Sign Up
            </Button>
            <AvatarGroup size='sm' ml={"46px"} max={3}>
                <Avatar name='Ryan Florence' src='https://bit.ly/ryan-florence' />
                <Avatar name='Segun Adebayo' src='https://bit.ly/sage-adebayo' />
                <Avatar name='Kent Dodds' src='https://bit.ly/kent-c-dodds' />
            </AvatarGroup>
            <Text ml={"11px"} fontSize={"14px"}>Join 1,239  others</Text>
        </Flex>
    </Box>;
}
