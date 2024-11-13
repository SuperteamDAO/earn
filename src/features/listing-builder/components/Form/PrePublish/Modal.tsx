import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { GeoLock, Visibility } from ".."
import { Separator } from "@/components/ui/separator"
import { Slug } from "./Slug"
import { Foundation } from "./Foundation"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { confirmModalAtom, isDraftSavingAtom, isEditingAtom, isSTAtom, previewAtom, submitListingMutationAtom } from "@/features/listing-builder/atoms"
import { ExternalLink, Loader2 } from "lucide-react"
import { useListingForm } from "@/features/listing-builder/hooks"
import { useState } from "react"
import { toast } from "sonner"
import { useWatch } from "react-hook-form"
import { useRouter } from "next/router"

export function PrePublish() {
  const isST = useAtom(isSTAtom)
  const form = useListingForm()
  const [open, isOpen] = useState(false)

  const isDraftSaving = useAtomValue(isDraftSavingAtom)
  const setConfirmModal = useSetAtom(confirmModalAtom)
  const setShowPreview = useSetAtom(previewAtom)

  const isEditing = useAtomValue(isEditingAtom)

  const submitListingMutation = useAtomValue(submitListingMutationAtom);

  const router = useRouter()
  return (
    <Dialog open={open} onOpenChange={(e) =>{
      if(isDraftSaving) return
      isOpen(e)
    }} >
      <Button
        disabled={isDraftSaving}
        onClick={async () => {
          if(await form.validateBasics()) isOpen(true)
        }}
      >
        Continue
      </Button>
      <DialogContent className="sm:max-w-[500px]  py-4" >
        <DialogHeader className=''>
          <DialogTitle className='text-md '>Few more things to consider:</DialogTitle>
        </DialogHeader>
        <Separator className='w-[100%] relativerl '/>
        <div className='space-y-4'>
          <Visibility />
          <GeoLock />
          <Slug />
          {isST && (
            <Foundation />
          )}
        </div>
        <DialogFooter className="pt-4 flex sm:justify-between w-full">
          <Button variant='outline' className="gap-8"
            disabled={isDraftSaving || submitListingMutation.isPending}
            onClick={() => {
              setShowPreview(true)
            }}
          >Preview <ExternalLink /> </Button>
          <Button className='px-12' 
            onClick={async() => {
              console.log('values ', form.getValues())
              if(await form.trigger()) {
                try {
                  const data = await form.submitListing()
                  isOpen(false)
                  if(isEditing) {
                    router.push('/dashboard/listings')
                  } else {
                    if(data.status === 'VERIFYING') {
                      setConfirmModal('VERIFICATION')
                    } else {
                      setConfirmModal('SUCCESS')
                    }
                  }
                } catch (error) {
                  console.log(error)
                  toast.error('Failed to create listing, please try again later', {
                  })
                }
              }
            }}
            disabled={isDraftSaving || submitListingMutation.isPending}
          >
            {submitListingMutation.isPending ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ): !!isEditing ? "Update" : "Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
