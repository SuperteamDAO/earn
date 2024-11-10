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
import { useAtom } from "jotai"
import { isGodAtom, isSTAtom } from "@/features/listing-builder/atoms"
import { ExternalLink } from "lucide-react"

export function PrePublish() {
  const isST = useAtom(isSTAtom)
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Continue</Button>
      </DialogTrigger>
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
          <Button variant='outline' className="gap-8">Preview <ExternalLink /> </Button>
          <Button className='px-12' >Publish</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
