import { Flex, Icon, type IconProps, Link } from '@chakra-ui/react';
import React from 'react';
import { type IconType } from 'react-icons';
import {
  FaDiscord,
  FaGithub,
  FaGlobe,
  FaLinkedin,
  FaTelegram,
  FaXTwitter,
} from 'react-icons/fa6';

interface SocialHOCIconProps extends Omit<IconProps, 'as'> {
  link?: string;
  as?: IconType;
}
const SocialIcon = ({ link, as, ...props }: SocialHOCIconProps) => {
  return (
    <Link href={link} rel="noopener noreferrer" target="_blank">
      <Flex>
        <Icon
          as={as}
          opacity={link ? '1' : '0.3'}
          cursor={link ? 'pointer' : 'auto'}
          filter={link ? '' : 'grayscale(80%)'}
          {...props}
        />
      </Flex>
    </Link>
  );
};

interface SocialIconProps extends Omit<SocialHOCIconProps, 'as'> {
  link?: string;
}

const Twitter = ({ link, ...props }: SocialIconProps) => (
  <SocialIcon as={FaXTwitter} link={link} {...props} />
);

const Telegram = ({ link, ...props }: SocialIconProps) => (
  <SocialIcon as={FaTelegram} link={link} {...props} />
);

const Linkedin = ({ link, ...props }: SocialIconProps) => (
  <SocialIcon as={FaLinkedin} link={link} {...props} />
);

const Website = ({ link, ...props }: SocialIconProps) => (
  <SocialIcon as={FaGlobe} link={link} {...props} />
);

const Discord = ({ link, ...props }: SocialIconProps) => (
  <SocialIcon as={FaDiscord} link={link} {...props} />
);

const GitHub = ({ link, ...props }: SocialIconProps) => (
  <SocialIcon as={FaGithub} link={link} {...props} />
);

export { Discord, GitHub, Linkedin, Telegram, Twitter, Website };
