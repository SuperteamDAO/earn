import { useFieldArray } from "react-hook-form";
import { Baseline, Info, Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAtomValue } from "jotai";
import { formAtom } from "../../atoms";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils";
import { useEffect } from "react";

const questionTypes = [
  { value: "text", label: "Text", icon: Baseline },
  { value: "link", label: "Link", icon: Link2 },
];

export function EligibilityQuestions() {
  const form = useAtomValue(formAtom);

  const { fields, append, remove } = useFieldArray({
    control: form?.control,
    name: "eligibility",
  });

  const handleAddQuestion = () => {
    append({
      order: fields.length + 1,
      question: "",
      type: "text",
    });
  };

  const handleRemoveQuestion = (index: number) => {
    remove(index);
  };

  useEffect(() => {
    if(form?.getValues().type === 'project') {
      if(fields.length === 0) handleAddQuestion()
    } else {
      if(fields.length === 1 && fields[0]?.question === "") {
        handleRemoveQuestion(0)
      }
    }
  },[form?.getValues().type])

  return (
    <FormField
      control={form?.control}
      name={`eligibility`}
      render={() => (
        <FormItem className='pt-2'>
          <div className='flex items-center gap-2'>
            <FormLabel className='uppercase text-slate-400 font-bold'>Custom Questions</FormLabel>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <Info className='h-3 w-3 text-slate-400' />
              </TooltipTrigger>
              <TooltipContent className='bg-slate-100 text-slate-700'>
                <p className='max-w-sm'>
                  {form?.getValues().type === 'project' ? 
                    `Applicant’s names, email IDs, Discord / Twitter IDs, and SOL wallet are collected by default. Please use this space to ask about anything else!` :
                    `The main bounty submission link, the submitter’s names, email IDs, Discord / Twitter IDs, and SOL wallet are collected by default. Please use this space to ask about anything else!`
                  }
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="space-y-4">
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form?.control}
                name={`eligibility.${index}.question`}
                render={() => (
                  <div key={field.id} className='group'>
                    <FormItem  >
                      <FormLabel>Question {index+1}</FormLabel>
                      <div className="flex border rounded-md ring-primary has-[:focus]:ring-1 items-center">
                        <FormField
                          control={form?.control}
                          name={`eligibility.${index}.type`}
                          render={({ field }) => (
                            <FormItem className="w-fit">
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <FormControl>
                                  <SelectTrigger className="w-fit rounded-none border-0 focus:ring-0 gap-1 border-r">
                                    <SelectValue className="w-fit ">
                                      {(() => {
                                        const selectedType = questionTypes.find(
                                          (type) => type.value === field.value
                                        );
                                        if (!selectedType) return "Type";
                                        const Icon = selectedType.icon;
                                        return <Icon className="h-4 w-4 text-slate-500" />;
                                      })()}
                                    </SelectValue>
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {questionTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      <div className="flex items-center text-slate-500 gap-2">
                                        <type.icon className="h-4 w-4" />
                                        {type.label}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form?.control}
                          name={`eligibility.${index}.question`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  placeholder="Enter your question" 
                                  className='border-none focus-visible:ring-0'
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form?.control}
                          name={`eligibility.${index}.order`}
                          render={({ field }) => (
                            <input type="hidden" {...field} value={index + 1} />
                          )}
                        />

                        {(fields.length !== 1 || form?.getValues().type !== 'project') && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive hidden group-hover:flex"
                            onClick={() => handleRemoveQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  </div>
                )}
              />
            ))}

            {form?.getValues().type === 'project' || fields.length < 2 ? (
              <div className='flex justify-between'>
                <FormMessage />
                <Button
                  type="button"
                  variant={fields.length === 0 ? "outline":"link"}
                  size='sm'
                  className={cn(
                    fields.length > 0 && "w-fit px-0 ml-auto flex",
                    fields.length === 0 && "w-full text-slate-500 mt-2",

                  )}
                  onClick={handleAddQuestion}
                >
                  <Plus /> Add Question
                </Button>
              </div>
            ) : (
                <FormDescription>Max two custom questions allow for bounties</FormDescription>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}
