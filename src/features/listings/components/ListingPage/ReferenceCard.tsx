import { Box } from '@chakra-ui/react';

import { OgImageViewer } from '@/components/shared/ogImageViewer';

export const ReferenceCard = ({
  link,
  title,
}: {
  link?: string;
  title?: string;
}) => {
  if (!link) return <></>;
  return (
    <Box
      w="100%"
      borderRadius={8}
      cursor="pointer"
      onClick={() => window.open(link, '_blank')}
    >
      <OgImageViewer
        showTitle
        title={title}
        externalUrl={link}
        w={'100%'}
        aspectRatio={1.91 / 1}
        objectFit="cover"
        borderRadius={6}
      />
    </Box>
  );
};
