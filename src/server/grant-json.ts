// Dates as Earn's API responses had them (ISO strings), so client
// components get the data they always did.
export type Jsonish<T> = T extends Date
  ? string
  : T extends ReadonlyArray<infer Item>
    ? Array<Jsonish<Item>>
    : T extends object
      ? { [Key in keyof T]: Jsonish<T[Key]> }
      : T;

export const toJson = <T>(value: T): Jsonish<T> =>
  // A plain-data round trip, exactly what a JSON response did.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  JSON.parse(JSON.stringify(value)) as Jsonish<T>;
