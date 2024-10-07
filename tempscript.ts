import MarkdownIt from 'markdown-it';

const md = new MarkdownIt();

function convertToHtml(rawText: string): string {
  // Preprocess the text to add line breaks before numbered list items
  const preprocessedText = rawText.replace(/(\d+\.)\s/g, '\n$1 ');

  // Convert to HTML
  return md.render(preprocessedText);
}

// Example usage
const rawTexts = [
  '1. Limited Access to Financial Services: Our platform provides essential financial services to underserved communities, enabling easy transactions without the need for traditional banking. 2. High Costs of Cross-Border Remittances: By using a decentralized agent network and AI optimization, we significantly reduce fees and processing times for remittances. 3. Lack of Interoperability: Our system enables seamless transactions across multiple blockchains, overcoming fragmentation and inefficiency. 4. Inefficient Mobile Payment Solutions: We prioritize accessibility with user-friendly interfaces, voice navigation, and offline capabilities to serve all users, especially PWDs. 5. Inaccessibility of Rewards Programs: Our tokenized loyalty rewards system offers clear, accessible benefits, making it easy for users to earn and redeem rewards. 6. Security Concerns: Our AI-powered fraud detection ensures secure transactions, building trust in virtual payments. 7. Complex Compliance Requirements: Automated compliance tools assist agents in navigating regulatory landscapes, simplifying operations.',
  'Phase 1: Final Development & Testing (Months 1-3) • Milestones: 1. Complete final feature development (Month2) 2. Conduct user acceptance testing (Month 3 3. Perform security audits and finalize user documentation (from Month 3). Phase 2: Marketing & Pre-Launch (Months 4-5) • Milestones: 1. Launch marketing campaign and secure partnerships (Month 4). 2. Set up customer support infrastructure (Month 5). Phase 3: Launch Preparation (Month 6) • Milestones: 1. Final system testing and compliance checks (Week 2). 2. Set up analytics tools for user monitoring (Week 3). Phase 4: Official Launch (Month 7) • Milestones: 1. Official product launch (Week 1). 2. Begin user onboarding and monitor engagement (Week 2). Phase 5: Post-Launch Optimization (Months 8-12) • Milestones: 1. Collect user feedback and iterate (Month 8). 2. Plan for feature enhancements (Month 9). 3. Continue marketing and scaling (Months 10-12).',
  '1. User Adoption Rate: Track new users joining monthly, aiming for 15-20% growth in the first year. 2. Transaction Volume: Measure total value of transactions, targeting $10M in the first 12 months. 3. Customer Retention Rate: Monitor how many users remain active, aiming for 70-80% retention after 6 months. 4. Remittance Cost Savings: Achieve 30-40% lower transaction fees compared to traditional remittance services. 5. User Engagement: Target 3-5 transactions per active user per month. 6. Customer Support Resolution Time: Aim to resolve 80% of issues within 24 hours. 7. Platform Uptime: Ensure 99.5% system uptime or higher.',
];

rawTexts.forEach((text, index) => {
  console.log(`HTML for text ${index + 1}:`);
  console.log(convertToHtml(text));
  console.log('\n');
});
