import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Fixed, Podiums, Range, Variable } from "./Types"
import { Footer } from "./Footer"
import { Separator } from "@/components/ui/separator"
import { TokenLabel, TokenSelect } from "./Tokens"
import { useListingForm } from "@/features/listing-builder/hooks"
import { useWatch } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useAtomValue } from "jotai"
import { listingTotalPrizesAtom } from "@/features/listing-builder/atoms"
import { formatNumberWithSuffix } from "@/utils/formatNumberWithSuffix"
import { Button } from "@/components/ui/button"
import { memo, useMemo } from "react"

export function RewardsSheet() {

  const form = useListingForm()

  const totalReward = useWatch({
    control: form.control,
    name:'rewardAmount'
  })
  const totalPrizes = useAtomValue(listingTotalPrizesAtom)
  const hasRewardsErrors = useMemo(() => {
    const errors = form.formState.errors
    return errors.rewards?.message || 
      (errors.rewards && Object.keys(errors.rewards).some(key => errors?.rewards?.[key]?.message));
  }, [form])

  return (
    <Sheet>
      <SheetTrigger className='w-full'>
        <FormField
          control={form.control}
          name="rewards"
          render={({}) =>{
            return (
              <FormItem className='flex flex-col items-start w-full group'>
                <FormLabel>Rewards</FormLabel>
                <div className='flex px-3 h-9 gap-2 bg-slate-50 border-slate-200 border w-full rounded-md items-center'>
                  <TokenLabel showIcon showSymbol 
                    amount={totalReward || 0}
                    classNames={{
                      amount: 'font-medium text-sm'
                    }}
                  />
                  <p className='text-xs text-slate-400'>
                    | {totalPrizes} Prizes
                  </p>
                  <Button variant='link'
                    size='sm'
                    className='ml-auto group-hover:underline'
                  >
                    Edit
                  </Button>
                </div>
                <FormMessage />
                {hasRewardsErrors && (
                  <p
                    className={"text-xs font-medium text-destructive"}
                  >
                    Please Resolve all errors in rewards
                  </p>
                )}
              </FormItem>
            )
          }}
        />
      </SheetTrigger>
      <SheetContent
        side='right' className='overflow-hidden flex flex-col sm:max-w-lg'
      >
            <SheetHeader>
              <SheetTitle>Add Rewards</SheetTitle>
            </SheetHeader>
            <div className='py-2 flex flex-col gap-y-4'>
              <TokenSelect />
              <Type />
            </div>
            <div className='mt-auto'>
              <Separator className='w-[150%] relative -left-20 my-4'/>
              <SheetFooter >
                <Footer />
              </SheetFooter>
            </div>
      </SheetContent>
    </Sheet>
  )
}

const Type = memo(() => {

  const form = useListingForm()
  const type = useWatch({
    control: form.control,
    name:'type'
  })
  const compensationType = useWatch({
    control: form.control,
    name:'compensationType'
  })
  if (type !== 'project') {
    return <Podiums />
  } else {
    switch (compensationType) {
      case 'fixed':
        return <Fixed />
      case 'range':
        return <Range />
      case 'variable':
        return <Variable />
      default:
        return null
    }
  }
})
