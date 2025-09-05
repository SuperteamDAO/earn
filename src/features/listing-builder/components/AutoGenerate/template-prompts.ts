import {
  Binary,
  CodeXml,
  Database,
  FileText,
  ImagePlay,
  Layers,
  MonitorSmartphone,
  Play,
  ShieldHalf,
  Users,
  Video,
} from 'lucide-react';

import FaXTwitter from '@/components/icons/FaXTwitter';

const BountyTemplates = [
  {
    name: 'Twitter Thread',
    icon: FaXTwitter,
    prompt:
      'Create a Twitter thread about our latest product launch. We need something that explains the key features in 5-10 tweets. Include visuals if you have design skills. Thread should be educational but not boring - make it something people actually want to read and share. Top 3 threads win: 1st place gets 1500 USDC, 2nd place gets 1000 USDC, 3rd place gets 500 USDC.',
  },
  {
    name: 'Long Form Article',
    icon: FileText,
    prompt:
      'Write a 1500-2000 word article exploring the future of decentralized finance. We want original perspectives backed by research, not just another generic DeFi explainer. Include real examples, potential risks, and your honest take on where things are heading. Best article wins 2000 USDC, runner-up gets 1000 USDC.',
  },
  {
    name: 'Hype Video',
    icon: Play,
    prompt:
      'Create a 30-60 second hype video for our upcoming event. Capture the energy and excitement without being cringe. Use footage from past events if available, or create motion graphics. Music choice is crucial - no generic corporate tracks please. Winners: 1st place 1800 USDC, 2nd place 1200 USDC, 3rd place 800 USDC.',
  },
  {
    name: 'Product Feedback',
    icon: MonitorSmartphone,
    prompt:
      'Test our beta app and provide detailed feedback. We need you to spend at least 2 hours using the product, document bugs with screenshots, and suggest improvements. Focus on user experience pain points and be brutally honest. Best 5 feedback reports each get 1000 USDC.',
  },
  {
    name: 'Content Creation',
    icon: ImagePlay,
    prompt:
      "Create original visual content for our social media channels. Could be infographics, memes, illustrations, or short animations. We need 5-10 pieces that fit our brand but push creative boundaries. Show us something we haven't seen before. Top 3 creators: 1st place 1500 USDC, 2nd place 1000 USDC, 3rd place 750 USDC.",
  },
];

const ProjectTemplates = [
  {
    name: 'Twitter Intern',
    icon: FaXTwitter,
    prompt:
      "Need someone to manage our Twitter account for the next month. You'll post 2-3 times daily, respond to mentions, engage with our community, and help grow our following. Looking for someone who gets crypto Twitter culture and can be funny without trying too hard. Fixed payment: 2000 USDC for the month.",
  },
  {
    name: 'Researcher',
    icon: FileText,
    prompt:
      "Looking for a researcher to write 4 in-depth articles over the next 6 weeks. Topics include market analysis, protocol deep-dives, and trend reports. You'll need to interview team members and external experts. Must be comfortable with technical topics and able to explain complex ideas simply. Budget: 2000 USDC total.",
  },
  {
    name: 'UI/UX Designer',
    icon: Layers,
    prompt:
      'Need a designer to redesign our dashboard interface. Current one is functional but ugly. We want something clean, intuitive, and modern without being overly trendy. Project includes user research, wireframes, and final designs in Figma. Timeline is 3 weeks. Budget: 2000 USDC.',
  },
  {
    name: 'Frontend Dev',
    icon: CodeXml,
    prompt:
      "Looking for a React developer to build out new features for our web app. You'll work from Figma designs and integrate with our existing API. Must be comfortable with TypeScript and have experience with Web3 integration. About 80 hours of work over 4 weeks. Fixed budget: 2000 USDC.",
  },
  {
    name: 'Backend Dev',
    icon: Database,
    prompt:
      'Need a backend developer to optimize our API and add new endpoints. Current setup is Node.js with PostgreSQL. Main focus is improving query performance and adding proper caching. Should take about 2 weeks of focused work. Paying 2000 USDC for the complete project.',
  },
  {
    name: 'Rust Dev',
    icon: ShieldHalf,
    prompt:
      'Looking for a Rust developer to audit and optimize our smart contracts on Solana. Need someone who can identify potential vulnerabilities and improve transaction efficiency. Experience with Anchor framework required. Estimated 60 hours of work. Fixed payment: 2000 USDC.',
  },
  {
    name: 'Full Stack Dev',
    icon: Binary,
    prompt:
      "Need a full stack developer to build a simple internal tool from scratch. It's a dashboard for tracking metrics with basic CRUD operations. Nothing fancy but needs to be reliable and well-documented. Tech stack is flexible but prefer Next.js. Timeline: 3 weeks. Budget: 2000 USDC.",
  },
  {
    name: 'Community Manager',
    icon: Users,
    prompt:
      "Looking for someone to manage our Discord and Telegram communities for 6 weeks. You'll moderate discussions, organize weekly community calls, create engagement initiatives, and compile weekly reports. Fixed payment: 2000 USDC.",
  },
  {
    name: 'Video Production',
    icon: Video,
    prompt:
      "Need a video editor to produce 8 short educational videos (2-3 minutes each) over the next month. We'll provide raw footage and talking points. You handle editing, graphics, music, and captions. Must deliver 2 videos per week. Total budget: 2000 USDC.",
  },
];

export { BountyTemplates, ProjectTemplates };
