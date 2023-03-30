import { Avatar, AvatarGroup, Box, Button, Flex, Text } from '@chakra-ui/react';
let slate = "#1E293B"

export default function Banner() {
    return <Box px={"2.625rem"} py={"2.125rem"} w={"46.0625rem"} h={"14.75rem"} rounded={"md"} mt={"24px"} bgImage="url('/assets/home/display/money_banner.png')" bgSize={"contain"}>
        <Text lineHeight={"1.875rem"} color={slate} fontFamily={"Domine"} fontWeight={"700"} fontSize={"1.625rem"}>
            Unlock Your Earning <br />
            Potential on Solana
        </Text>
        <Text w={"60%"} mt={"0.4375rem"} color={slate}>
            Explore bounties, grants, and job opportunities for developers and non-technical talent alike
        </Text>
        <Flex mt={"1.5625rem"} alignItems={"center"}>
            <Button bg={"#6366F1"} color={"white"} fontSize={"0.875rem"} px={"2.25rem"} py={"0.75rem"}>
                Sign Up
            </Button>
            <AvatarGroup size='sm' ml={"2.875rem"} max={3}>
                <Avatar name='Ryan Florence' src='https://bit.ly/ryan-florence' />
                <Avatar name='Segun Adebayo' src='https://bit.ly/sage-adebayo' />
                <Avatar name='Kent Dodds' src='https://bit.ly/kent-c-dodds' />
            </AvatarGroup>
            <Text ml={"0.6875rem"} fontSize={"0.875rem"}>Join 1,239  others</Text>
        </Flex>
    </Box>;
}
