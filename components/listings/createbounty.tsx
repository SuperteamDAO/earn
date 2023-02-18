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
import { CreatebountyPayment } from './CreateBountyPayments';
export interface BountyBasicType {
  title: string;
  // description: string;
  contact: string;
  skills: string;
  deadline: string;
  estimatedTime: string;
}
interface Props {
  steps: number;
}
export const Createbounty = ({ steps }: Props) => {
  // handles the info from basic form
  const [bountybasic, setBountyBasic] = useState<BountyBasicType | undefined>();

  return (
    <>
      {steps === 2 && <CreatebountyBasic setbountyBasic={setBountyBasic} />}

      {steps === 4 && <CreatebountyPayment />}
    </>
  );
};
