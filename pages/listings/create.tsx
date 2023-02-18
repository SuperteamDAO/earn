import { Flex } from '@chakra-ui/react';
import FormLayout from '../../layouts/FormLayout';
import { Createbounty } from '../../components/listings/createbounty';

const content = <Flex py={4}>jere</Flex>;
const CreateListing = () => {
  return (
    <>
      <FormLayout
        steps={[
          { label: 'Step 1', content },
          { label: 'Step 2', content },
          { label: 'Step 3', content },
        ]}
      >
        <Createbounty />
      </FormLayout>
    </>
  );
};

export default CreateListing;
