import {
  Code,
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
    prompt: `Create a Twitter thread about our latest product launch. We need something that explains the key features in 5-10 tweets. Include visuals if possible. Thread should be educational but not boring - make it something people actually want to read and share. 
Threads will be judged on clarity, creativity, and shareability. 
1st place gets 500 USDC, 2nd place gets 300 USDC, 3rd place gets 200 USDC.`,
  },
  {
    name: 'Long Form Article',
    icon: FileText,
    prompt:
      'Write a 1500-2000 word article exploring the future of decentralized finance. We want original perspectives backed by research, not just another generic DeFi explainer. Include real examples, potential risks, and your honest take on where things are heading. \nPost on blogging platforms like Substack or Medium. Articles must include references or links to cited data and examples. \n1st place gets 750 USDC, 2nd place gets 500 USDC, 3rd place gets 250 USDC. Bonus prizes of 50 USDC for 5.',
  },
  {
    name: 'Hype Video',
    icon: Play,
    prompt:
      'Create a 30-60 second hype video for our upcoming event. Capture the energy and excitement without being cringe. Use footage from past events if available, or create motion graphics. Music choice is crucial - no generic corporate tracks please. \nSubmit videos in at least 1080p resolution. Strong transitions, motion graphics, and sync with audio will be key judging criteria. \n1st place 750 USDC, 2nd place 500 USDC, 3rd place 250 USDC. Bonus prizes of 50 USDC for 5.',
  },
  {
    name: 'Product Feedback',
    icon: MonitorSmartphone,
    prompt:
      'Test our beta app and provide detailed feedback. We need you to spend time using the product, document bugs with screenshots, and suggest improvements. Focus on user experience pain points and be brutally honest. \nReports should be structured (bugs, UX issues, suggestions), and include annotated screenshots or screen recordings where relevant.\nTop 5 feedback reports each get 250 USDC.',
  },
  {
    name: 'Content Creation',
    icon: ImagePlay,
    prompt:
      'Create content about our recent launch and post it on X. Content can be in the form of threads, video, memes, infographics, illustrations, or short animations. \nSubmissions will be judged on clarity, creativity, and shareability. \n1st place 750 USDC, 2nd place 500 USDC, 3rd place 250 USDC. Bonus prizes of 50 USDC for 5.',
  },
];

const ProjectTemplates = [
  {
    name: 'Full Stack Dev',
    icon: Code,
    prompt:
      "Need a full stack developer to build a simple internal tool from scratch. It's a dashboard for tracking metrics with basic CRUD operations. Nothing fancy but needs to be reliable and well-documented. Tech stack is flexible but prefer Next.js. \nTimeline: 3 weeks. Share past work involving internal tools, admin dashboards, or metrics panels. Clean code and good docs are must-haves. \nBudget: 2000 USDC.",
  },
  {
    name: 'UI/UX Designer',
    icon: Layers,
    prompt:
      'Need a designer to redesign our dashboard interface. Current one is functional but ugly. We want something clean, intuitive, and modern without being overly trendy. Scope includes user research, wireframes, and final designs in Figma. \nTimeline is 3 weeks. Share a portfolio link with relevant SaaS or Web3 UI work. Include at least one Figma file or case study. \nBudget: 2000 USDC.',
  },
  {
    name: 'Twitter Intern',
    icon: FaXTwitter,
    prompt:
      "Need someone to manage our Twitter account for the next month. You'll post 2-3 times daily, respond to mentions, engage with our community, and help grow our following. Looking for someone who gets crypto Twitter culture and can be funny without trying too hard. \nPlease include 2-3 example tweets and any crypto accounts you've previously managed. \nFixed payment: 2000 USDC for the month.",
  },
  {
    name: 'Researcher',
    icon: FileText,
    prompt:
      "Looking for a researcher to write 4 in-depth articles over the next 6 weeks. Topics include market analysis, protocol deep-dives, and trend reports. You'll need to interview team members and external experts. Must be comfortable with technical topics and able to explain complex ideas simply. \nInclude writing samples, and mention any prior work involving original research or expert interviews. \nBudget: 2000 USDC total.",
  },
  {
    name: 'Frontend Dev',
    icon: CodeXml,
    prompt:
      "Looking for a React developer to build out new features for our web app. You'll work from Figma designs and integrate with our existing API. Must be comfortable with TypeScript and have experience with Web3 integration. About 80 hours of work over 4 weeks. \nSubmit links to your GitHub or live projects. Experience with wallet integrations or dApps is a strong plus. \nFixed budget: 2000 USDC.",
  },
  {
    name: 'Backend Dev',
    icon: Database,
    prompt:
      "Need a backend developer to optimize our API and add new endpoints. Current setup is Node.js with PostgreSQL. Main focus is improving query performance and adding proper caching. \nShould take about 2 weeks of focused work. Highlight similar work you've done, particularly performance improvements or schema optimizations. \nPaying 2000 USDC for the complete project.",
  },
  {
    name: 'Rust Dev',
    icon: ShieldHalf,
    prompt:
      'Looking for a Rust developer to audit and optimize our smart contracts on Solana. Need someone who can identify potential vulnerabilities and improve transaction efficiency. Experience with Anchor framework required. \nEstimated 60 hours of work. Link to previous audits or Solana smart contract repos using Anchor. Security-first mindset is essential. \nFixed payment: 2000 USDC.',
  },
  {
    name: 'Community Manager',
    icon: Users,
    prompt:
      "Looking for someone to manage our Discord and Telegram communities for 6 weeks. You'll moderate discussions, organize weekly community calls, create engagement initiatives, and compile weekly reports. \nInclude past experience running Web3 communities and a short plan for how you'd drive engagement in week 1. \nFixed payment: 2000 USDC.",
  },
  {
    name: 'Video Production',
    icon: Video,
    prompt:
      "Need a video editor to produce 8 short educational videos (2-3 minutes each) over the next month. We'll provide raw footage and talking points. You handle editing, graphics, music, and captions. \nMust deliver 2 videos per week. Deliver in 1080p+, with consistent visual style, lower thirds, and clear, embedded captions. \nTotal budget: 2000 USDC.",
  },
];

export { BountyTemplates, ProjectTemplates };
