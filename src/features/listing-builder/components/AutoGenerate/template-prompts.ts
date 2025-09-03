import {
  Binary,
  CodeXml,
  Database,
  FileText,
  Layers,
  MonitorSmartphone,
  Play,
  Users,
} from 'lucide-react';

import FaXTwitter from '@/components/icons/FaXTwitter';

const BountyTemplates = [
  {
    name: 'Twitter Thread',
    icon: FaXTwitter,
    prompt:
      'Create an engaging Twitter thread that breaks down complex topics into digestible, shareable content. Focus on storytelling, clear takeaways, and strategic use of hooks to maximize engagement. Include relevant hashtags, mentions, and calls-to-action that encourage retweets and meaningful discussions within your target audience.',
  },
  {
    name: 'Long Form Article',
    icon: FileText,
    prompt:
      'Write a comprehensive, well-researched article that provides deep insights and value to readers. Structure your content with compelling headlines, subheadings, and smooth transitions. Include data-driven arguments, expert quotes, and actionable advice while maintaining readability and SEO optimization throughout the piece.',
  },
  {
    name: 'Hype Video',
    icon: Play,
    prompt:
      'Produce an exciting promotional video that captures attention and builds anticipation around your product, event, or announcement. Focus on dynamic visuals, energetic pacing, and emotional storytelling that resonates with your target audience. Include clear branding and a strong call-to-action to drive desired outcomes.',
  },
  {
    name: 'Product Feedback',
    icon: MonitorSmartphone,
    prompt:
      'Conduct thorough product analysis and provide constructive feedback on usability, design, features, and overall user experience. Include specific recommendations for improvements, identify pain points, and suggest solutions that align with user needs and business objectives. Present findings in a clear, actionable format.',
  },
];

const ProjectTemplates = [
  {
    name: 'Twitter Intern',
    icon: FaXTwitter,
    prompt:
      'Manage social media presence by creating daily tweets, engaging with followers, and monitoring trends. Develop content calendars, respond to comments professionally, track engagement metrics, and identify opportunities for viral content. Support community building efforts and maintain brand voice consistency across all interactions.',
  },
  {
    name: 'Long Form Article',
    icon: FileText,
    prompt:
      'Research and write in-depth articles on industry topics, conducting interviews with experts and analyzing market trends. Create compelling narratives that educate and engage readers while driving organic traffic. Collaborate with editorial teams to ensure content aligns with brand guidelines and publication standards.',
  },
  {
    name: 'UI/UX Designer',
    icon: Layers,
    prompt:
      'Design intuitive user interfaces and optimize user experiences across web and mobile platforms. Conduct user research, create wireframes and prototypes, and collaborate with development teams to implement designs. Focus on accessibility, usability testing, and creating cohesive design systems that enhance user satisfaction and conversion rates.',
  },
  {
    name: 'Frontend Dev',
    icon: CodeXml,
    prompt:
      'Build responsive, interactive web applications using modern frameworks and technologies. Translate design mockups into clean, maintainable code while ensuring cross-browser compatibility and optimal performance. Collaborate with designers and backend developers to create seamless user experiences that meet technical requirements and business objectives.',
  },
  {
    name: 'Backend Dev',
    icon: Database,
    prompt:
      'Develop robust server-side applications, APIs, and database architectures that power web and mobile applications. Focus on scalability, security, and performance optimization while implementing best practices for code organization and documentation. Ensure seamless integration with frontend systems and third-party services.',
  },
  {
    name: 'Smart Contract Dev',
    icon: Binary,
    prompt:
      'Design and develop secure, efficient smart contracts for blockchain platforms. Conduct thorough testing and security audits to prevent vulnerabilities. Stay updated with latest blockchain technologies and implement gas optimization strategies. Collaborate with frontend developers to integrate contracts with user-facing applications and ensure seamless Web3 experiences.',
  },
  {
    name: 'Community Manager',
    icon: Users,
    prompt:
      'Build and nurture online communities across multiple platforms while fostering meaningful engagement and brand loyalty. Create community guidelines, moderate discussions, organize events, and develop strategies to grow active membership. Analyze community metrics and feedback to improve user experience and strengthen brand relationships.',
  },
];

export { BountyTemplates, ProjectTemplates };
