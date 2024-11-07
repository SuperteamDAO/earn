import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Templates } from "../Modals";
import { useController } from "react-hook-form";
import { useAtomValue } from "jotai";
import { MinimalTiptapEditor } from "@/components/tiptap";
import { formAtom } from "../../atoms";

export function DescriptionAndTemplate() {
  const form = useAtomValue(formAtom)

  const {
    field: { onChange, value },
  } = useController({
    name: 'description',
    control: form?.control,
    defaultValue: form?.getValues().description || '',
  });
  return (
    <FormField
      name='description'
      control={form?.control}
      render={() => {
        return (
          <FormItem >
            <div className='flex justify-between items-center'>
              <FormLabel>Listing Title</FormLabel>
              <Templates />
            </div>
            <div className="flex border rounded-md ring-primary has-[:focus]:ring-1">
              <FormControl>
                <MinimalTiptapEditor
                  value={value}
                  onChange={onChange}
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

