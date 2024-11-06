import { PrimitiveAtom, useAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { ReactNode, useEffect, useMemo } from "react";

// useful for provider (component locked atoms)
interface HydrateAtomsProps {
  initialValues: Array<[PrimitiveAtom<any>, any]>;
  children: ReactNode;
}
export const HydrateAtoms: React.FC<HydrateAtomsProps> = ({ initialValues, children }) => {
  console.log('initialValues',initialValues)
  useHydrateAtoms(initialValues);
  return children;
};

// useful for global atoms
export const useInitAtom = <T>(atom: PrimitiveAtom<T>, initialValue: T) => {
  const [value, setValue] = useAtom(atom);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return useMemo(() => [value ?? initialValue, setValue], [value]);
};

export const useInitAtomValue = <T>(atom: PrimitiveAtom<T>, initialValue: T) => {
  const [value] = useInitAtom(atom, initialValue);
  return value
}
