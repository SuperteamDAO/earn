import { FileText, ImagePlay, MonitorSmartphone, Play } from 'lucide-react';

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

export { BountyTemplates };
