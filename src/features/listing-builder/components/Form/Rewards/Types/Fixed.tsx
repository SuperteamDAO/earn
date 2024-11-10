import { memo, useCallback, useState } from "react";
import {TokenNumberInput} from "../Tokens";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, useFormField } from "@/components/ui/form";
import { getRankLabels } from "@/utils/rank";
import { Control, useController, useForm, useFormContext } from "react-hook-form";
import { ListingFormData } from "@/features/listing-builder/types";

interface FormFieldContentProps {
  control: Control<ListingFormData>;
  position: number;
}

export function Fixed() {
  const [value, setValue] = useState(0)
  // const form = useAtomValue(formAtom)
  const form = useForm({
    defaultValues: {
      "username": 0
    }
  })
  return (
  <div>
      {/* working */}
      <TokenNumberInput value={value} onChange={(e) => {setValue(e ?? 0)}} />
</div>
  )
}
