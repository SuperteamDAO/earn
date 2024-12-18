import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { TERMS_OF_USE } from '@/constants/TERMS_OF_USE';

export const SubmissionTerms = ({
  isOpen,
  onClose,
  sponsorName,
  entityName,
}: {
  isOpen: boolean;
  onClose: () => void;
  sponsorName: string;
  entityName?: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal>
      <DialogContent
        className="max-w-xl overflow-hidden rounded-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="gap-5 px-5 py-4">
          <div className="flex items-center justify-center rounded-full bg-slate-200 p-3">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.9998 0.666748H2.99977C2.20412 0.666748 1.44106 0.982818 0.878451 1.54543C0.315841 2.10804 -0.000228882 2.8711 -0.000228882 3.66675V27.6667C-0.000228882 28.4624 0.315841 29.2255 0.878451 29.7881C1.44106 30.3507 2.20412 30.6667 2.99977 30.6667H20.9998C21.7954 30.6667 22.5585 30.3507 23.1211 29.7881C23.6837 29.2255 23.9998 28.4624 23.9998 27.6667V9.66675L14.9998 0.666748ZM20.9998 27.6667H2.99977V3.66675H13.4998V11.1667H20.9998V27.6667Z"
                fill="#4D55E4"
              />
            </svg>
          </div>
          <p className="items-start text-xl font-semibold">Terms of Use</p>
        </div>
        <Separator className="border-b-2" />
        <div className="flex flex-col items-start gap-3 px-5 py-4 text-left font-medium text-slate-500">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              You acknowledge that you are submitting your work or application
              to {entityName ? `${entityName} ("${sponsorName}")` : sponsorName}
              .
            </li>
            <li>
              Superteam Earn acts solely as a platform for the Partner to list
              contests, bounties, projects or similar engagements{' '}
              {`("Activities")`} on its platform {`("ST Earn Platform")`}.
            </li>
            <li>
              Superteam Earn shall not be liable for any Activities listed by
              the Partner on the ST Earn Platform. The Partner is solely
              responsible for the content, rules, scope and execution of their
              Activities.
            </li>
            <li>
              Users participating in Activities listed by Partners do so at
              their own risk and discretion. Superteam Earn disclaims all
              liabilities related to user participation in such Activities.
            </li>
            <li>
              Any disputes or issues arising between users and partners
              regarding Activities shall be resolved directly between the
              parties involved. Superteam Earn shall not be responsible for
              mediating or resolving such disputes.
            </li>
            <li>
              By using the platform and participating in any Activities, users
              agree to release Superteam Earn from any claims, liabilities, or
              damages arising from their participation in Activities listed by
              Partners.
            </li>
            <li>
              Superteam Earn does not guarantee the accuracy or legality of
              Activities listed by Partners. Users are advised to exercise
              caution and conduct their own due diligence before participating
              in any Activities.
            </li>
            <li>
              Partners listing Activities on the Platform agree to indemnify and
              hold Superteam Earn harmless from any claims, damages, or
              liabilities arising from their Activities.
            </li>
          </ul>
          <p className="leading-5">
            These terms are in addition to our{' '}
            <Link
              className="underline underline-offset-2"
              href={TERMS_OF_USE}
              rel="noopener noreferrer"
              target="_blank"
            >
              Terms of Use
            </Link>
            .
          </p>
          <Button onClick={onClose} className="ml-auto px-10 text-lg">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
