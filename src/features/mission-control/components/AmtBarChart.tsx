import { Box, Heading } from '@chakra-ui/react';
import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';

interface DataPoint {
  name: string;
  value: number;
}

interface AmtBarChartProps {
  data: DataPoint[];
}

const formatYAxis = (value: number): string => {
  if (value >= 1000000) return `$${value / 1000000}M`;
  if (value >= 1000) return `$${value / 1000}k`;
  return `$${value}`;
};

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    return (
      <Box
        p={2}
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="lg"
      >
        <strong>{label}</strong>:{' '}
        {payload[0]?.value && formatYAxis(payload[0].value)}
      </Box>
    );
  }
  return null;
};

const CustomBar: React.FC<any> = (props) => {
  const { fill, x, y, width, height } = props;
  const radius = 10;
  return (
    <g>
      <path
        d={`
          M${x},${y + height}
          L${x},${y + radius}
          Q${x},${y} ${x + radius},${y}
          L${x + width - radius},${y}
          Q${x + width},${y} ${x + width},${y + radius}
          L${x + width},${y + height}
          Z
        `}
        fill={fill}
      />
    </g>
  );
};

export const AmtBarChart: React.FC<AmtBarChartProps> = ({ data }) => {
  return (
    <Box
      w="100%"
      h="300px"
      p={4}
      pb={10}
      bg="white"
      borderWidth="1px"
      borderRadius="lg"
    >
      <Heading mb={4} size="sm">
        Approved Amount
      </Heading>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis
            tickFormatter={formatYAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="value"
            fill="#6366F1"
            shape={<CustomBar />}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
