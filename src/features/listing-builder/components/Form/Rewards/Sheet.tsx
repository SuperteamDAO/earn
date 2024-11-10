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
import { Button } from "@/components/ui/button"
import { memo, useEffect, useMemo } from "react"
import { PaymentType } from "./PaymentType"
import { calculateTotalPrizes } from "@/features/listing-builder/utils/rewards"
import { formatNumberWithSuffix } from "@/utils/formatNumberWithSuffix"

export function RewardsSheet() {

  const form = useListingForm()

  const type = useWatch({
    control: form.control,
    name:'type'
  })

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
                <div className='flex pl-3 h-9 bg-slate-50 border-slate-200 border w-full rounded-md items-center'>
                  <Label />
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
          {type === 'project' && (
            <PaymentType />
          )}
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

const Label = memo(() => {
  const form = useListingForm()
  const type = useWatch({
    control: form.control,
    name:'type'
  })
  const compensationType = useWatch({
    control: form.control,
    name:'compensationType'
  })
  const rewards = useWatch({
    control: form.control,
    name:'rewards'
  })
  const maxBonusSpots = useWatch({
    control: form.control,
    name:'maxBonusSpots'
  })
  const totalReward = useWatch({
    control: form.control,
    name:'rewardAmount'
  })
  const minRewardAsk = useWatch({
    control: form.control,
    name:'minRewardAsk'
  })
  const maxRewardAsk = useWatch({
    control: form.control,
    name:'maxRewardAsk'
  })

  const totalPrizes = useMemo(() => calculateTotalPrizes(rewards, maxBonusSpots || 0), [type, maxBonusSpots])

  useEffect(() => {
    console.log('compensationType',compensationType)
  },[compensationType])

  useEffect(() => {
    console.log('type',type)
  },[type])

  if(type !== 'project') {
    return (
      <>
        <TokenLabel showIcon showSymbol 
          amount={totalReward || 0}
          classNames={{
            amount: 'font-medium text-sm'
          }}
        /> 
        <TypeLabelText>
          | {totalPrizes} {totalPrizes === 1 ? 'Prize' : 'Prizes'}
        </TypeLabelText>
      </>
    )
  } else {
    if(compensationType === 'fixed') {
      return (
        <>
          <TokenLabel showIcon showSymbol 
            amount={totalReward || 0}
            classNames={{
              amount: 'font-medium text-sm'
            }}
          /> 
          <TypeLabelText>
            | Fixed Prize
          </TypeLabelText>
        </>
      )
    } else if(compensationType === 'range') {
      return (
        <>
          <TokenLabel showIcon 
            amount={minRewardAsk || 0}
            classNames={{
              amount: 'font-medium text-sm mr-0'
            }}
            formatter={(n) => formatNumberWithSuffix(n)+'' || "0"}
            className='mr-1'
          />
          <p>-</p>
          <TokenLabel showIcon={false} showSymbol 
            className='ml-1'
            amount={maxRewardAsk || 0}
            classNames={{
              amount: 'font-medium text-sm ml-0'
            }}
            formatter={(n) => formatNumberWithSuffix(n)+'' || "0"}
          />
          <TypeLabelText>
            | Range Prize
          </TypeLabelText>
        </>
      )
    } else if(compensationType === 'variable') {
      <>
        <TokenLabel showIcon showSymbol />
        <TypeLabelText>
          | Variable Prize
        </TypeLabelText>
      </>
    }
  }
  return (
    <>
      <TokenLabel showIcon showSymbol />
      <TypeLabelText>
        | Variable Prize
      </TypeLabelText>
    </>
  )
})

function TypeLabelText({children}: {children: React.ReactNode}) {
  return (
    <p className='text-xs text-slate-400 capitalize whitespace-nowrap overflow-hidden text-ellipsis ml-1'>
      {children}
    </p>
  )
}
