// The shape a Prisma payload has after crossing the API as JSON: Dates become
// ISO strings. Lets client query types derive from the route's own select.
export type JsonResponse<T> = T extends Date
  ? string
  : T extends readonly (infer Item)[]
    ? JsonResponse<Item>[]
    : T extends object
      ? { [Key in keyof T]: JsonResponse<T[Key]> }
      : T;
