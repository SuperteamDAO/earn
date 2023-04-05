import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { SponsorStore } from '../store/sponsor';
import { Redis } from '@upstash/redis';
//types
import { SponsorType } from '../interface/sponsor';
import {
  Bounties,
  DraftType,
  GrantsType,
  JobsType,
  SubmissionType,
  SubscribeType,
} from '../interface/listings';
import toast from 'react-hot-toast';
import { Comments } from '../interface/comments';
import { client } from './algolia';
import { Talent } from '../interface/talent';
import moment from 'moment';

const Backend_Url = process.env.NEXT_PUBLIC_BACKEND_URL;

export const redis = new Redis({
  url: process.env.NEXT_PUBLIC_REDIS_URL,
  token: process.env.NEXT_PUBLIC_REDIS_TOKEN,
});

export const createUser = async (publickey: string) => {
  const id = uuidV4();
  try {
    const res = await axios.post(`${Backend_Url}/user/create`, {
      id: id,
      publickey,
    });
    return res.data;
  } catch (e) {
    console.log(e);
    return null;
  }
};
export const UpdateUser = async (id: string, update: any) => {
  try {
    const res = await axios.patch(`${Backend_Url}/user/update`, {
      id: id,
      update,
    });
    return res;
  } catch (e) {
    console.log(e);
    return null;
  }
};
export const genrateOtp = async (publicKey: string, email: string) => {
  try {
    const res = await axios.post(`${Backend_Url}/email/totp`, {
      publicKey,
      email,
    });
    return res.headers.get;
  } catch (e) {
    console.log(e);
    return null;
  }
};
// Sponsors
export const createSponsor = async (sponsor: SponsorType) => {
  try {
    const res = await axios.post(`${Backend_Url}/sponsor/create`, {
      ...sponsor,
    });
    return res.data;
  } catch (e) {
    console.log(e);
    return null;
  }
};

export const findSponsors = async (publicKey: string) => {
  if (!publicKey) return null;
  try {
    const { data } = await axios.get(
      `${Backend_Url}/sponsor/find?publickey=${publicKey}`
    );
    SponsorStore.setState({
      currentSponsor: data.data[0],
    });
    return data.data ?? [];
  } catch (error) {
    console.log(error);
    return null;
  }
};
export const DeleteSponsor = async (id: string) => {
  try {
    const { data } = await axios.delete(`${Backend_Url}/sponsor/delete/${id}`);
    return data;
  } catch (e) {
    console.log(e);

    return null;
  }
};

export const findSponsorListing = async (orgId: string) => {
  if (!orgId) {
    throw new Error('orgId undefined!');
  }
  let res = await axios.get(`${Backend_Url}/listings/find?orgId=${orgId}`);
  return res.data.data;
};

// Drafts
export const findSponsorDrafts = async (orgId: string) => {
  if (!orgId) {
    throw new Error('orgId undefined!');
  }
  let res = await axios.get(`${Backend_Url}/drafts/findall?orgId=${orgId}`);
  return res.data.data;
};
export const CreateDraft = async (draft: DraftType) => {
  try {
    const { data } = await axios.post(`${Backend_Url}/drafts/create`, {
      ...draft,
    });
    return data.data;
  } catch (e) {
    return null;
  }
};
export const findOneDraft = async (id: string) => {
  const { data, status } = await axios.get(
    `${Backend_Url}/drafts/find?id=${id}`
  );
  if (status == 200) {
    return data;
  } else if (status === 204) {
    return toast.error('draft not found');
  } else {
    return null;
  }
};
export const findTeam = async (id: string) => {
  if (!id) return null;
  try {
    const { data } = await axios.get(`${Backend_Url}/sponsor/team?id=${id}`);

    return data.data ?? [];
  } catch (error) {
    console.log(error);
    return null;
  }
};

// Bounties
export const createBounty = async (
  bounties: Bounties,
  sponsor: SponsorType
) => {
  try {
    const { data } = await axios.post(`${Backend_Url}/listings/bounty/create`, {
      id: bounties.id,
      title: bounties.title,
      token: bounties.token,
      slug: bounties.slug,
      deadline: bounties.deadline,
      description: bounties.description,
      sponsorStatus: bounties.sponsorStatus,
      featured: bounties.featured,
      orgId: sponsor.orgId,
      skills: bounties.skills,
      subSkills: bounties.subSkills,
      prizeList: bounties.prizeList,
      active: bounties.active,
      private: false,
      amount: bounties.amount,
      eligibility: bounties.eligibility,
      status: bounties.status,
    });
    return data;
  } catch (e) {
    console.log(e);
    return null;
  }
};
type FindBoutiesReturn = {
  listing: Bounties;
  sponsor: SponsorType;
} | null;

export const findBouties = async (slug: string): Promise<FindBoutiesReturn> => {
  if (!slug) return null;
  const { data, status } = await axios.get(
    `${Backend_Url}/listings/bounty/find/${slug}`
  );
  if (status === 204) {
    return null;
  }

  return data.data;
};

export const createJob = async (jobs: JobsType) => {
  try {
    const res = await axios.post(`${Backend_Url}/listings/job/create`, {
      ...jobs,
    });
    return res;
  } catch (error) {
    console.log(error);

    return null;
  }
};
export const createGrants = async (grants: GrantsType) => {
  try {
    const res = await axios.post(`${Backend_Url}/listings/grants/create`, {
      ...grants,
    });
    return res;
  } catch (error) {
    console.log(error);

    return null;
  }
};

export const createComment = async (comment: Comments) => {
  const { data, status } = await axios.post(`${Backend_Url}/comment/create`, {
    ...comment,
  });

  if (status !== 200) {
    return null;
  }
  return data;
};

export const findTalentPubkey = async (pubkey: string) => {
  const { data, status } = await axios.get(
    `${Backend_Url}/talent/find/publickey/${pubkey}`
  );

  if (status !== 200) {
    return null;
  }
  return data;
};

export const fetchComments = async (id: string) => {
  if (!id) return null;
  const { data } = await axios.get(`${Backend_Url}/comment/find/${id}`);

  return data.data ?? [];
};

export const createSubmission = async (sub: SubmissionType) => {
  try {
    const { data, status } = await axios.post(
      `${Backend_Url}/submission/create`,
      {
        ...sub,
      }
    );
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchOgImage = async (url: string) => {
  try {
    const res = await axios.post(`${Backend_Url}/submission/ogimage`, {
      url: url,
    });
    return res.data;
  } catch (error) {
    return null;
  }
};
export const addLike = async (id: string, likeId: string) => {
  try {
    const res = await axios.post(`${Backend_Url}/submission/create/like`, {
      id,
      likeId,
    });
    return res.data;
  } catch (error) {
    return null;
  }
};

export const findSubmission = async (id: string) => {
  try {
    const { status, data } = await axios.get(
      `${Backend_Url}/submission/find/${id}`
    );

    if (status !== 200) {
      return null;
    }

    return data.data as SubmissionType;
  } catch (error) {
    console.log(error);

    return null;
  }
};

type FindJobsReturn = {
  listing: JobsType;
  sponsor: SponsorType;
} | null;
export const findJobs = async (slug: string): Promise<FindJobsReturn> => {
  if (!slug) return null;
  try {
    const { data, status } = await axios.get(
      `${Backend_Url}/listings/jobs/find/${slug}`
    );
    if (status !== 200) {
      return null;
    }
    return data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
type FindGrantsReturn = {
  listing: GrantsType;
  sponsor: SponsorType;
} | null;
export const findGrants = async (slug: string): Promise<FindGrantsReturn> => {
  if (!slug) return null;
  try {
    const { data, status } = await axios.get(
      `${Backend_Url}/listings/grants/find/${slug}`
    );
    if (status !== 200) {
      return null;
    }
    return data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
export const createSubscription = async (sub: SubscribeType) => {
  try {
    const { data, status } = await axios.post(
      `${Backend_Url}/listings/sub/create`,
      {
        ...sub,
      }
    );
    if (status !== 201) {
      return null;
    }
    return data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const removeSubscription = async (id: string) => {
  try {
    const { data, status } = await axios.delete(
      `${Backend_Url}/listings/sub/delete/${id}`
    );
    if (status !== 200) {
      return null;
    }
    return data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const createQuestions = async (questions: {
  id: string;
  bountiesId: string;
  questions: string;
}) => {
  try {
    const { data, status } = await axios.post(
      `${Backend_Url}/listings/question/create`,
      {
        ...questions,
      }
    );
    console.log(data, status);

    if (status !== 201) {
      return null;
    }
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchAll = async (
  search: string | undefined,
  filter: string | undefined
): Promise<{
  grants: {
    grants: GrantsType;
    sponsorInfo: SponsorType;
  }[];
  jobs: { jobs: JobsType; sponsorInfo: SponsorType }[];
  bounty: { bounty: Bounties; sponsorInfo: SponsorType }[];
} | null> => {
  try {
    if (search || filter) {
      const index = client.initIndex('listings');
      const jobs: { jobs: JobsType; sponsorInfo: SponsorType }[] = [];
      const bounties: { bounty: Bounties; sponsorInfo: SponsorType }[] = [];
      const grants: {
        grants: GrantsType;
        sponsorInfo: SponsorType;
      }[] = [];
      const { hits }: { hits: any } = await index.search(
        search
          ? filter
            ? ((filter + search) as string)
            : (search as string)
          : (filter as string),
        {}
      );

      hits.map((hit: any) => {
        if (hit.jobs as any) {
          console.log(hit.jobs.description);

          jobs.push({
            jobs: hit.jobs,
            sponsorInfo: hit.sponsorInfo,
          });
        } else if (hit.bounty) {
          bounties.push({
            bounty: hit.bounty,
            sponsorInfo: hit.sponsorInfo,
          });
        } else if (hit.grants) {
          grants.push({
            grants: hit.grants,
            sponsorInfo: hit.sponsorInfo,
          });
        }
      });
      const active: { bounty: Bounties; sponsorInfo: SponsorType }[] = [];
      const inActive: { bounty: Bounties; sponsorInfo: SponsorType }[] = [];
      bounties.map((a) => {
        if (a.bounty.active) {
          return active.push(a);
        } else {
          return inActive.push(a);
        }
      });
      active.sort((a, b) => {
        return (
          parseInt(moment(b.bounty.deadline).format('x')) -
          parseInt(moment(a.bounty.deadline).format('x'))
        );
      });
      return {
        bounty: [...active, ...inActive],
        grants: grants,
        jobs: jobs,
      };
    }
    const bountyPromise: Promise<
      { bounty: Bounties; sponsorInfo: SponsorType }[] | null
    > = redis.get('bounties');
    const jobsPromise: Promise<
      { jobs: JobsType; sponsorInfo: SponsorType }[] | null
    > = redis.get('jobs');
    const grantsPromise: Promise<
      | {
          grants: GrantsType;
          sponsorInfo: SponsorType;
        }[]
      | null
    > = redis.get('grants');

    const [bounties, jobs, grants] = await Promise.all([
      bountyPromise,
      jobsPromise,
      grantsPromise,
    ]);
    const active: { bounty: Bounties; sponsorInfo: SponsorType }[] = [];
    const inActive: { bounty: Bounties; sponsorInfo: SponsorType }[] = [];
    bounties?.map((a) => {
      console.log(a.bounty.active);

      if (a.bounty.active) {
        return active.push(a);
      } else {
        return inActive.push(a);
      }
    });
    active.sort((a, b) => {
      return (
        parseInt(moment(b.bounty.deadline).format('x')) -
        parseInt(moment(a.bounty.deadline).format('x'))
      );
    });
    return {
      bounty: [...active, ...inActive] as {
        bounty: Bounties;
        sponsorInfo: SponsorType;
      }[],
      grants: grants as {
        grants: GrantsType;
        sponsorInfo: SponsorType;
      }[],
      jobs: jobs as { jobs: JobsType; sponsorInfo: SponsorType }[],
    };
  } catch (error) {
    console.log(error, 'error');
    return null;
  }
};

export const AllGrants = async (): Promise<
  | {
      grants: GrantsType;
      sponsorInfo: SponsorType;
    }[]
  | null
> => {
  try {
    const { data } = await axios.get(`${Backend_Url}/listings/grants/find/all`);
    console.log(data);

    return data.data;
  } catch (error) {
    console.log(error, 'error');
    return null;
  }
};

export const updateNotification = async (
  id: string,
  notification: string[]
) => {
  try {
    const { data, status } = await axios.post(
      `${Backend_Url}/talent/notification/update/${id}`,
      {
        notification,
      }
    );
    if (status !== 200) {
      return null;
    }
    return data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetchBasicInfo = async (): Promise<{
  total: number;
  count: number;
} | null> => {
  try {
    const res = (await redis.get('basicInfo')) as {
      total: number;
      count: number;
    };

    return res;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const TalentTVE = async (): Promise<Talent[] | null> => {
  try {
    const { data } = await axios.get(`${Backend_Url}/talent/find/tve`);
    return data.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
