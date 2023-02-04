import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDownIcon } from '@chakra-ui/icons';

export const CreateSponsors = () => {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm();
  const onSubmit = () => {};
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Flex w="100%" justify="space-between" gap="2rem">
          <Box w="50%">
            <FormControl isRequired>
              <Text
                color="gray.400"
                fontSize="1.4rem"
                textAlign="start"
                fontWeight={600}
                marginBottom="0.5rem"
              >
                Sponsor name
              </Text>
              <Input
                h="4.3rem"
                fontSize="1.5rem"
                fontWeight={500}
                focusBorderColor="#CFD2D7"
                placeholder="Company name"
                onChange={(e) => {}}
              />
              {/* {errors.name && (
                <FormErrorMessage fontSize="1.1rem">
                  {errors.name}
                </FormErrorMessage>
              )} */}
            </FormControl>
          </Box>
          <Box w="50%">
            <FormControl>
              <Text
                color="gray.400"
                fontSize="1.4rem"
                textAlign="start"
                fontWeight={600}
                marginBottom="0.5rem"
              >
                Company URL
              </Text>
              <Input
                h="4.3rem"
                // disabled={uploading}
                fontSize="1.5rem"
                focusBorderColor="#CFD2D7"
                fontWeight={500}
                placeholder="Enter your website"
                onChange={(e) => {}}
              />
              {/* {errors.website && (
                <FormErrorMessage fontSize="1.1rem">
                  {errors.website}
                </FormErrorMessage>
              )} */}
            </FormControl>
          </Box>
        </Flex>

        <FormControl as={Box} alignSelf="start">
          <Text
            fontWeight={600}
            fontSize="1.4rem"
            textAlign="start"
            color="gray.400"
            marginBottom="0.5rem"
          >
            Add your logo
          </Text>
          <Flex align="center" justify="center" gap="2rem" w="30%">
            <Flex
              w="5.5rem"
              h="5.5rem"
              borderRadius="50%"
              // border={
              //   companyDetails.logo
              //     ? '2px transparent'
              //     : errors.logo
              //     ? '2px dashed #FF8585'
              //     : '2px dashed #E2E8EF'
              // }
              position="relative"
              bg="#F7FAFC"
              align="center"
              justify="center"
              style={{
                // backgroundImage: imageBlob && `url(${imageBlob})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
              }}
            >
              <label
                htmlFor="icon-button-logo"
                style={{
                  cursor: 'pointer',
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <input
                  // onChange={(e: any) => {
                  //   if (e.target.files) {
                  //     if (e.target.files[0].size > 250000) {
                  //       toast.error('File size must be less than 250KB');
                  //       return;
                  //     }
                  //     setImageBlob(URL.createObjectURL(e.target.files[0]));
                  //     setUploading(true);
                  //     const promise = uploadFile(e.target.files[0], 0);
                  //     toast
                  //       .promise(promise, {
                  //         loading: 'Uploading logo',
                  //         success: 'Successfully uploaded logo',
                  //         error: 'Error upload logo',
                  //       })
                  //       .then((logo) => {
                  //         console.log('Uploaded Logo: ', logo);
                  //         setCompanyDetails({ ...companyDetails, logo: logo });
                  //         setUploading(false);
                  //       });
                  //   }
                  // }}
                  id="icon-button-logo"
                  type="file"
                  accept="image/*"
                  multiple={false}
                  style={{ display: 'none' }}
                />
                {/* {!companyDetails.logo && (
                  <Image src={UploadIcon} alt="Upload Icon" />
                )} */}
              </label>
            </Flex>
            <Button
              w="8.7rem"
              h="3.2rem"
              fontSize="1.3rem"
              fontWeight={500}
              color="gray.400"
              onClick={() => {
                const inputElem = document.getElementById('icon-button-logo');
                inputElem?.click();
              }}
            >
              UPLOAD
            </Button>
          </Flex>
          {/* {errors.logo && (
            <FormErrorMessage fontSize="1.1rem">{errors.logo}</FormErrorMessage>
          )} */}
        </FormControl>

        <Box w="100%">
          <FormControl isInvalid={errors.email ? true : false}>
            <Text
              color="gray.400"
              fontSize="1.4rem"
              textAlign="start"
              fontWeight={600}
              marginBottom="0.5rem"
            >
              Email
            </Text>
            <Input
              h="4.3rem"
              fontSize="1.5rem"
              focusBorderColor="#CFD2D7"
              fontWeight={500}
              placeholder="Work email"
              type="email"
              onChange={(e) => {}}
            />
            {/* {companyDetails.email && (
              <FormErrorMessage fontSize="1.1rem">
                {errors.email}
              </FormErrorMessage>
            )} */}
          </FormControl>
        </Box>

        <Flex w="100%" justify="space-between" gap="2rem">
          <FormControl w="50%" isInvalid={errors.industry ? true : false}>
            <Text
              color="gray.400"
              fontSize="1.4rem"
              textAlign="start"
              fontWeight={600}
              marginBottom="0.5rem"
            >
              Industry
            </Text>
            <Menu>
              <MenuButton
                border={
                  errors.industry ? '2px solid #FF8585' : '2px solid #e2e8f0'
                }
                as={Button}
                rightIcon={<ChevronDownIcon />}
                w="100%"
                h="4.3rem"
                fontSize="1.5rem"
                fontWeight={500}
                // color={companyDetails.industry ? 'gray.700' : '#aab4c0'}
                bg="transparent"
              >
                {/* {(companyDetails && companyDetails.industry) ||
                  'Pick an industry'} */}
              </MenuButton>
              {/* <MenuList
                w="28rem"
                fontSize="1.5rem"
                fontWeight={500}
                color="gray.400"
              >
                {IndustryList.map((industry: any) => (
                  <MenuItem
                    key={industry}
                    onClick={() =>
                      // setCompanyDetails({ ...companyDetails, industry })
                    }
                  >
                    {industry}
                  </MenuItem>
                ))}
              </MenuList> */}
            </Menu>
            {/* {errors.industry && (
              <FormErrorMessage fontSize="1.1rem">
                {errors.industry}
              </FormErrorMessage>
            )} */}
          </FormControl>
          <Box w="50%">
            <FormControl isInvalid={errors.twitter ? true : false}>
              <Text
                color="gray.400"
                fontSize="1.4rem"
                textAlign="start"
                fontWeight={600}
                marginBottom="0.5rem"
              >
                Twitter
              </Text>
              <InputGroup>
                <InputLeftElement
                  pointerEvents="none"
                  h="100%"
                  marginLeft="0.5rem"
                  // eslint-disable-next-line react/no-children-prop
                  children={
                    <Flex w="2rem" h="2rem" align="center" justify="center">
                      <Image
                        src={'/assets/logo/twitter.svg'}
                        alt="Twitter Icon"
                      />
                    </Flex>
                  }
                />
                <Input
                  // disabled={uploading}
                  h="4.3rem"
                  padding="0 4rem"
                  fontSize="1.5rem"
                  focusBorderColor="#CFD2D7"
                  fontWeight={500}
                  placeholder="@yourtwitter"
                  onChange={(e) => {}}
                />
              </InputGroup>
              {/* {errors.twitter && (
                <FormErrorMessage fontSize="1.1rem">
                  {errors.twitter}
                </FormErrorMessage>
              )} */}
            </FormControl>
          </Box>
        </Flex>

        <Box w="100%">
          <FormControl isInvalid={errors.bio ? true : false}>
            <Text
              color="gray.400"
              fontSize="1.4rem"
              textAlign="start"
              fontWeight={600}
              marginBottom="0.5rem"
            >
              Company Short bio
            </Text>
            <Input
              maxLength={160}
              h="4.3rem"
              fontSize="1.5rem"
              focusBorderColor="#CFD2D7"
              fontWeight={500}
              placeholder="One sentence that describes your project"
              onChange={(e) => {}}
            />
            {errors.bio && (
              <FormErrorMessage fontSize="1.1rem">{}</FormErrorMessage>
            )}
          </FormControl>
        </Box>
        <Button
          w="100%"
          variant="primary"
          fontSize="1.5rem"
          fontWeight={600}
          h="5rem"
          onClick={onSubmit}
        >
          Continue
        </Button>
      </form>
    </>
  );
};
