import { Button } from "@/components/ui/button";
import { calculateTotalPrizes } from "@/features/listing-builder/utils/rewards";
import { TokenLabel } from "./Tokens";
import { useListingForm } from "@/features/listing-builder/hooks";
import { useEffect, useState } from "react";
import { useWatch } from "react-hook-form";
import { useAtomValue } from "jotai";
import { listingTotalPrizesAtom } from "@/features/listing-builder/atoms";

function RewardsFooter() {
  const form = useListingForm()
  const type = useWatch({
    control: form.control,
    name:'type'
  })
  const rewardAmount = useWatch({
    control: form.control,
    name:'rewardAmount'
  })

  const totalPrize = useAtomValue(listingTotalPrizesAtom)

  return (
    <div className='w-full space-y-4'>
      <div className='flex justify-between items-center text-sm font-medium'>
        {type !== 'project' && (
          <span className='flex gap-2 '>
            <p className=''>{totalPrize}</p>
            <p className='text-slate-400'>
              Total {totalPrize > 1 ? 'Prizes' : 'Prize'}
            </p>
          </span>
        )}
        <TokenLabel
          showIcon
          showSymbol
          amount={rewardAmount}
        />
      </div>
      <Button className='w-full'>
        Continue
      </Button>
    </div>
  )
}
export {RewardsFooter as Footer}
