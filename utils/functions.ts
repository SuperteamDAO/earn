import axios from 'axios';
import { v4 as uuidV4 } from 'uuid';
import { SponsorStore } from '../store/sponsor';
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
import { genrateuuid } from './helpers';
import toast from 'react-hot-toast';
import { Comments } from '../interface/comments';
import { JobType } from '../interface/types';

const Backend_Url = process.env.NEXT_PUBLIC_BACKEND_URL;

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
      id: genrateuuid(),
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
    const { data } = await axios.post(`${Backend_Url}/submission/create`, {
      ...sub,
    });
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
