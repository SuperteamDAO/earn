import type { ImageProps } from '@chakra-ui/react';
import { Image, Skeleton } from '@chakra-ui/react';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import type { Metadata } from 'unfurl.js/dist/types';

interface Props {
  externalUrl: string;
  w?: string | number;
  h?: string | number;
  objectFit?: ImageProps['objectFit'];
  borderTopRadius?: string | number;
}

const OgImageViewer: React.FC<Props> = ({ externalUrl, ...props }) => {
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(null);
  const fallbackImage = '/assets/fallback/profilefeed.png';

  useEffect(() => {
    const fetchImage = async () => {
      if (externalUrl) {
        try {
          const { data } = (await axios.post('/api/og', {
            url: externalUrl,
          })) as { data: Metadata };

          const ogImage = data.open_graph?.images?.[0]?.url;
          setOgImageUrl(ogImage || fallbackImage);
        } catch (error) {
          setOgImageUrl(fallbackImage);
        }
      } else {
        setOgImageUrl(fallbackImage);
      }
    };

    fetchImage();
  }, [externalUrl]);

  return (
    <div>
      {ogImageUrl ? (
        <Image alt="OG Image" src={ogImageUrl} {...props} />
      ) : (
        <Skeleton {...props} />
      )}
    </div>
  );
};

export default OgImageViewer;
