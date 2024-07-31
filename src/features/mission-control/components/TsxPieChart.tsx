import {
  Box,
  Center,
  Flex,
  Icon,
  Table,
  Tbody,
  Td,
  Text,
  Tr,
} from '@chakra-ui/react';
import React from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { getLabelForTsxType, type TSXTYPE } from '../utils';
import { TsxTypeIcon } from './TsxTypeIcon';

interface PaymentData {
  name: string;
  value: number;
  color: string;
  type: TSXTYPE;
}

interface TsxPieChartProps {
  data: PaymentData[];
}

export const TsxPieChart: React.FC<TsxPieChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return value >= 1000
      ? `$${(value / 1000).toFixed(0)}k`
      : `$${value.toFixed(2)}`;
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box p={2} fontSize="sm" bg="white" borderRadius="md" shadow="md">
          <Flex align="center" gap={2}>
            <Box
              w="0.75rem"
              h="0.75rem"
              borderRadius="50%"
              bgColor={data.color}
            />
            <Text fontWeight={500}>
              {getLabelForTsxType(data.name?.toLowerCase())}
            </Text>
          </Flex>
          <Text gap={2} display="flex" mt={1}>
            Value:
            <Text fontWeight={600}>{formatCurrency(data.value)}</Text>{' '}
          </Text>
        </Box>
      );
    }
    return null;
  };

  const CustomizedLegend = ({ payload }: { payload?: any[] }) => {
    if (!payload || payload.length === 0) return null;
    return (
      <Box overflowY="auto" ml={4}>
        <Table size="sm" variant="unstyled">
          <Tbody>
            {payload.map((entry: any, index: number) => (
              <Tr key={`item-${index}`}>
                <Td pr={12}>
                  <Flex align="center" gap={2}>
                    <Box
                      w="1rem"
                      h="1rem"
                      borderRadius="50%"
                      bgColor={entry.color}
                    />
                    <Center p={1} bg="gray.100" rounded="md">
                      <Icon
                        as={TsxTypeIcon}
                        color="#64748B"
                        type={entry.payload.type}
                      />
                    </Center>
                    {getLabelForTsxType(entry.value?.toLowerCase())}
                  </Flex>
                </Td>
                <Td fontWeight={500} isNumeric>
                  {formatCurrency(entry.payload.value)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    );
  };

  return (
    <Box
      w="full"
      h="300px"
      p={4}
      bg="white"
      borderWidth="1px"
      borderRadius="lg"
    >
      <Text color="gray.600" fontWeight={500}>
        Overview
      </Text>
      <ResponsiveContainer
        width="100%"
        height="100%"
        style={{ maxWidth: '35rem' }}
      >
        <PieChart>
          <Pie
            isAnimationActive={false}
            data={data}
            cx="50%"
            cy="47%"
            innerRadius={60}
            outerRadius={80}
            dataKey="value"
            style={{ outline: 'none' }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={<CustomizedLegend />}
            layout="vertical"
            verticalAlign="middle"
            align="right"
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};
