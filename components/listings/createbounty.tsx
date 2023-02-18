import { ChevronDownIcon, DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Switch,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { tokenList, PrizeList } from '../../constants';
import { Skill, SkillList, TalentSkillMap } from '../../interface/types';
import { CreatebountyBasic } from './CreateBountyBasic';
export interface BountyBasicType {
  title: string;
  // description: string;
  contact: string;
  skills: string;
  deadline: string;
  estimatedTime: string;
}
export const Createbounty = () => {
  // handles the info from basic form
  const [bountybasic, setBountyBasic] = useState<BountyBasicType | undefined>();

  return (
    <>
      <CreatebountyBasic setbountyBasic={setBountyBasic} />
    </>
  );
};
