import { PrismaClient } from '@prisma/client';
import { exit } from 'process';

const prisma = new PrismaClient();



async function findBounty(identifier) {
  let bounty;
  if (identifier.uuid) {
    bounty = await prisma.bounties.findUnique({
      where: { id: identifier.uuid },
    });
  }

  if (identifier.slug) {
    bounty = await prisma.bounties.findUnique({
      where: { slug: identifier.slug },
    });
  }

  if (identifier.sponsorSlug && identifier.sequenceId) {
    bounty = await prisma.bounties.findFirst({
      where: {
        sponsor: { slug: identifier.sponsorSlug },
        sequentialId: identifier.sequenceId,
      },
    });
  }
  
  return JSON.parse(JSON.stringify(bounty));
}

async function createTemplate(bounty) {
  // Fields to copy directly from bounty to template
  const templateData = {
    title: bounty.title,
    description: bounty.description,
    deadline: bounty.deadline,
    skills: bounty.skills,
    type: bounty.type,
    requirements: bounty.requirements,
    region: bounty.region,
    applicationType: bounty.applicationType,
    status: bounty.status,
    timeToComplete: bounty.timeToComplete,
    token: bounty.token,
    compensationType: bounty.compensationType,
    maxRewardAsk: bounty.maxRewardAsk,
    minRewardAsk: bounty.minRewardAsk,
    language: bounty.language,
    rewardAmount: bounty.rewardAmount,
    rewards: bounty.rewards,
    maxBonusSpots: bounty.maxBonusSpots,
    sponsorId: bounty.sponsorId,
    pocId: bounty.pocId,
    pocSocials: bounty.pocSocials,
    source: bounty.source,
    eligibility: bounty.eligibility,
    // Add mock values for optional fields
    color: '#FF5733', // Example hex color
    emoji: '🚀',
    isFeatured: false,
    isActive: true,
    isArchived: false,
    slug: `template-${bounty.slug}`,
    isPublished: false
  };

  // Create the template
  const template = await prisma.bountiesTemplates.create({
    data: templateData
  });

  return template;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Please provide either a UUID, slug, or sponsor-slug/sequenceId');
    console.error('Usage:');
    console.error('  npm run create-template <uuid>');
    console.error('  npm run create-template <slug>');
    console.error('  npm run create-template <sponsor-slug>/<sequenceId>');
    exit(1);
  }

  const identifier = args[0];
  let bountyIdentifier = {};

  if (identifier.includes('/')) {
    const [sponsorSlug, sequenceId] = identifier.split('/');

    if (!sponsorSlug || !sequenceId) {
      console.error('Invalid identifier provided');
      exit(1);
    }

    bountyIdentifier = {
      sponsorSlug,
      sequenceId: parseInt(sequenceId, 10),
    };
  } else if (identifier.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    bountyIdentifier = { uuid: identifier };
  } else {
    bountyIdentifier = { slug: identifier };
  }

  try {
    const bounty = await findBounty(bountyIdentifier);
    
    if (!bounty) {
      console.error('Bounty not found');
      exit(1);
    }

    const template = await createTemplate(bounty);
    console.log('Template created successfully:', template);
  } catch (error) {
    console.error('Error:', error);
    exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

export {
  findBounty,
  createTemplate,
  main
};

main();
