import { type PrimitiveAtom, useAtom } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { type ReactNode, useEffect, useMemo } from 'react';

// useful for provider (component locked atoms)
interface HydrateAtomsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- jotai keeps its per-atom tuple type (InferAtomTuples) internal, so a mixed list of atoms cannot be typed without any
  initialValues: Array<[PrimitiveAtom<any>, any]>;
  children: ReactNode;
}
export const HydrateAtoms: React.FC<HydrateAtomsProps> = ({
  initialValues,
  children,
}) => {
  useHydrateAtoms(initialValues);
  return children;
};

// useful for global atoms
export const useInitAtom = <T>(atom: PrimitiveAtom<T>, initialValue: T) => {
  const [value, setValue] = useAtom(atom);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return useMemo(() => [value ?? initialValue, setValue], [value, setValue]);
};
