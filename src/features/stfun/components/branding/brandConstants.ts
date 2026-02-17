export const BRAND_COLORS = {
  superPurple: { hex: '#5522e0', rgb: 'R:85 G:34 B:224', name: 'Super Purple' },
  purpleTint: { hex: '#bcb3ff', rgb: 'R:188 G:179 B:255', name: 'Purple Tint' },
  superYellow: {
    hex: '#f4a60b',
    rgb: 'R:244 G:166 B:11',
    name: 'Super Yellow',
  },
  yellowTint: { hex: '#ffd9a1', rgb: 'R:255 G:217 B:161', name: 'Yellow Tint' },
  black: { hex: '#000000', rgb: 'R:0 G:0 B:0', name: 'Black' },
  white: { hex: '#ffffff', rgb: 'R:255 G:255 B:255', name: 'White' },
  darkBg: { hex: '#121212', rgb: 'R:18 G:18 B:18', name: 'Dark Background' },
} as const;

export const TYPOGRAPHY = {
  h1: {
    label: 'H1',
    font: 'Archivo Semi Expanded',
    weight: 'Extra Bold',
    weightNum: 800,
    sample: 'Stronger Together',
  },
  h2: {
    label: 'H2',
    font: 'Archivo Semi Expanded',
    weight: 'Semi Bold',
    weightNum: 600,
    sample: 'The forefront community for web3',
  },
  b1: {
    label: 'B1',
    font: 'Archivo Semi Expanded',
    weight: 'Medium',
    weightNum: 500,
    sample:
      'At Superteam, we help the most promising projects in the Solana ecosystem in the ascending world launch and grow.',
  },
  b2: {
    label: 'B2',
    font: 'Archivo Semi Expanded',
    weight: 'Light',
    weightNum: 300,
    sample:
      'We are organized as a co-operative of creatives, operators, and investors who are experienced in launching and growing technology businesses.',
  },
} as const;

export const LOGO_RULES = {
  donts: [
    'Do not use the logo in an angle',
    'Do not distort the logo or its form',
    'Do not change the placement',
    'Do not put a stroke around the logo',
    'Do not use the logo in more than one colour',
    'Do not add any effects to the logo',
    'Do not change relation of sizes',
    'Do not change alignment',
  ],
};

export const LOGO_VARIATIONS = [
  {
    bg: '#5522e0',
    fill: '#f4a60b',
    labelColor: '#ffffff',
    label: 'Yellow on Purple',
  },
  {
    bg: '#f4a60b',
    fill: '#5522e0',
    labelColor: '#000000',
    label: 'Purple on Yellow',
  },
  {
    bg: '#ffffff',
    fill: '#000000',
    labelColor: '#666666',
    label: 'Black on White',
  },
  {
    bg: '#000000',
    fill: '#ffffff',
    labelColor: '#999999',
    label: 'White on Black',
  },
  {
    bg: '#ffffff',
    fill: '#5522e0',
    labelColor: '#666666',
    label: 'Purple on White',
  },
  {
    bg: '#ffffff',
    fill: '#f4a60b',
    labelColor: '#666666',
    label: 'Yellow on White',
  },
] as const;

export const SECTIONS = [
  { id: 'logo', num: '1', title: 'Primary Logo' },
  { id: 'symbol', num: '2', title: 'Symbol' },
  { id: 'colors', num: '3', title: 'Colour Variations' },
  { id: 'palette', num: '4', title: 'Colour Palette' },
  { id: 'typography', num: '5', title: 'Typography' },
  { id: 'incorrect', num: '6', title: 'Incorrect Usage' },
] as const;
