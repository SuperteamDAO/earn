import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Templates } from "../Modals";
import { useAtomValue } from "jotai";
import { formAtom } from "../../atoms";
import { MinimalTiptapEditor } from "@/components/tiptap";

export function DescriptionAndTemplate() {
  const form = useAtomValue(formAtom)

  return (
    <FormField
      name='description'
      control={form?.control}
      render={({field}) => {
        return (
          <FormItem >
            <div className='flex justify-between items-center'>
              <FormLabel>Description</FormLabel>
              <Templates />
            </div>
            <div className="flex border rounded-md ring-primary has-[:focus]:ring-1">
              <FormControl>
                <MinimalTiptapEditor
                  value={field.value}
                  onChange={field.onChange}
                  className="w-full border-0 min-h-[60vh]"
                  editorContentClassName="p-4 px-2 h-full"
                  output="html"
                  placeholder="Type your description here..."
                  editable={true}
                  editorClassName="focus:outline-none"
                />
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  );
}

