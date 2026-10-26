import 'server-only';

import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';

import { getViewer } from '@/lib/session';
import { runtime } from '@/server/runtime';
import * as SponsorStages from '@/server/sponsor-stage';

import { SponsorStageSnackbarView } from './SponsorStageSnackbarView';

// Earn showed it only on wide screens.
export async function SponsorStageSnackbar() {
  const viewer = await getViewer();
  const sponsorId = viewer?.currentSponsorId;
  if (!sponsorId) return null;
  const [data, now] = await runtime.runPromise(
    Effect.all([
      SponsorStages.SponsorStages.use((stages) => stages.stage(sponsorId)).pipe(
        Effect.orElseSucceed(() => null),
      ),
      Clock.currentTimeMillis,
    ]),
  );
  if (!data) return null;
  return (
    <div className="hidden lg:block">
      <SponsorStageSnackbarView
        stage={data.stage}
        listing={data.listing}
        now={now}
      />
    </div>
  );
}
