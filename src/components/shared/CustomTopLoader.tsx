import { Box, useColorModeValue } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

export function CustomTopLoader() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const loadingRef = useRef(false);

  const loaderColor = useColorModeValue('brand.purple', 'brand.purple.light');

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;

    const handleStart = () => {
      loadingRef.current = true;
      progressRef.current = 0;
      setProgress(0);

      progressInterval = setInterval(() => {
        if (progressRef.current >= 90) {
          clearInterval(progressInterval);
        } else {
          progressRef.current += 10;
          setProgress(progressRef.current);
        }
      }, 100);
    };

    const handleComplete = () => {
      clearInterval(progressInterval);
      progressRef.current = 100;
      setProgress(100);

      setTimeout(() => {
        loadingRef.current = false;
        setProgress(0);
      }, 300);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      clearInterval(progressInterval);
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <Box
      pos="fixed"
      zIndex={9999}
      top={0}
      left={0}
      w="100%"
      h="2px"
      opacity={loadingRef.current ? 1 : 0}
      transition="opacity 0.3s ease-in-out"
    >
      <Box
        w={`${progress}%`}
        h="100%"
        bg={loaderColor}
        transition="width 0.2s ease-in-out"
      />
    </Box>
  );
}
