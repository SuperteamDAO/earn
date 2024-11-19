import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useUser } from '@/store/user';

interface AlertOptionProps {
  title: string;
  category: string;
  selectedCategories: string[];
  onCategoryChange: (category: string) => void;
}

const AlertOption = ({
  title,
  category,
  selectedCategories,
  onCategoryChange,
}: AlertOptionProps) => (
  <div className="flex items-center justify-between">
    <p className="mt-1 font-medium text-slate-500">{title}</p>
    <Switch
      className="mt-0.5"
      checked={selectedCategories.includes(category)}
      onCheckedChange={() => onCategoryChange(category)}
    />
  </div>
);

export const EmailSettingsModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { user, refetchUser } = useUser();
  const posthog = usePostHog();

  const emailSettings = user?.emailSettings || [];
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    emailSettings.map((setting) => setting.category),
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const updateEmailSettings = async () => {
    try {
      posthog.capture('confirm_email preferences');
      setIsUpdating(true);
      await axios.post('/api/user/update-email-settings', {
        categories: selectedCategories,
      });

      await refetchUser();
      setIsUpdating(false);
      onClose();
      toast.success('Email preferences updated');
    } catch (error) {
      console.error('Error updating email preferences:', error);
      toast.error('Failed to update email preferences.');
      setIsUpdating(false);
    }
  };

  const showSponsorAlerts = user?.currentSponsorId;
  const showTalentAlerts = user?.isTalentFilled;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="p-2">
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-slate-700">
            Update Email Preferences
          </h2>
          <p className="mt-1 font-medium text-slate-400">
            Tell us which emails you would like to receive!
          </p>
          {showSponsorAlerts && (
            <div className="mt-6">
              <p className="mb-1 mt-6 text-sm tracking-[0.8px] text-slate-400">
                SPONSOR ALERTS
              </p>
              <AlertOption
                title="New submissions received for your listing"
                category="submissionSponsor"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Comments Received on your listing"
                category="commentSponsor"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Deadline related reminders"
                category="deadlineSponsor"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          )}
          {showTalentAlerts && (
            <div className="mt-6">
              <p className="mb-1 mt-6 text-sm tracking-[0.8px] text-slate-400">
                TALENT ALERTS
              </p>
              <AlertOption
                title="Weekly Roundup of new listings"
                category="weeklyListingRoundup"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="New listings added for my skills"
                category="createListing"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Likes and comments on my submissions"
                category="commentOrLikeSubmission"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Sponsor Invitation Emails (Scout)"
                category="scoutInvite"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          )}
          {(showTalentAlerts || showSponsorAlerts) && (
            <div className="mt-6">
              <p className="mb-1 mt-6 text-sm tracking-[0.8px] text-slate-400">
                GENERAL ALERTS
              </p>
              <AlertOption
                title="Comment replies and tags"
                category="replyOrTagComment"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
              <AlertOption
                title="Product updates and newsletters"
                category="productAndNewsletter"
                selectedCategories={selectedCategories}
                onCategoryChange={handleCategoryChange}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            className="ph-no-capture mx-5 mb-3 w-full"
            disabled={isUpdating}
            onClick={updateEmailSettings}
          >
            {isUpdating ? 'Updating Preferences..' : 'Update Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
