/**
 * Custom ESM loader for executing test scripts against production TypeScript services
 * without requiring pre-compiled node_modules or generated Prisma clients in local CI/codespace.
 */

export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@/prisma') {
    return {
      url: 'data:text/javascript,' + encodeURIComponent(`
        export const prisma = {
          $queryRaw: async (sql) => []
        };
      `),
      shortCircuit: true,
    };
  }

  if (specifier === '@/prisma/client') {
    return {
      url: 'data:text/javascript,' + encodeURIComponent(`
        class Sql {
          constructor(strings, values) {
            this.strings = strings;
            this.values = values;
          }
          get sql() {
            return this.strings.join('?');
          }
        }

        function sql(strings, ...values) {
          let finalStrings = [strings[0]];
          let finalValues = [];

          for (let i = 0; i < values.length; i++) {
            const val = values[i];
            if (val instanceof Sql) {
              finalStrings[finalStrings.length - 1] += val.strings[0];
              for (let j = 0; j < val.values.length; j++) {
                finalValues.push(val.values[j]);
                finalStrings.push(val.strings[j + 1]);
              }
              finalStrings[finalStrings.length - 1] += strings[i + 1];
            } else {
              finalValues.push(val);
              finalStrings.push(strings[i + 1]);
            }
          }
          return new Sql(finalStrings, finalValues);
        }

        function join(elements, separator = ',') {
          if (elements.length === 0) return sql\`\`;
          const sep = typeof separator === 'string' ? separator : ',';
          let finalStrings = [''];
          let finalValues = [];

          for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (i > 0) {
              finalStrings[finalStrings.length - 1] += sep;
            }
            if (el instanceof Sql) {
              finalStrings[finalStrings.length - 1] += el.strings[0];
              for (let j = 0; j < el.values.length; j++) {
                finalValues.push(el.values[j]);
                finalStrings.push(el.strings[j + 1]);
              }
            } else {
              finalValues.push(el);
              finalStrings.push('');
            }
          }
          return new Sql(finalStrings, finalValues);
        }

        export const Prisma = {
          Sql,
          sql,
          join,
          empty: sql\`\`,
          raw: (str) => new Sql([str], []),
        };
      `),
      shortCircuit: true,
    };
  }

  if (specifier === 'zod') {
    return {
      url: 'data:text/javascript,' + encodeURIComponent(`
        export const z = {
          enum: (vals) => {
            const enumObj = {
              safeParse: (v) => ({ success: vals.includes(v), data: v }),
              optional: () => ({
                safeParse: (v) => ({ success: v === undefined || vals.includes(v), data: v })
              })
            };
            return enumObj;
          },
          string: () => {
            const obj = {
              min: () => obj,
              uuid: () => obj,
              refine: (fn) => ({
                safeParse: (v) => {
                  if (typeof v !== 'string' || !fn(v)) return { success: false };
                  return { success: true, data: v };
                },
                optional: () => ({
                  safeParse: (v) => {
                    if (v === undefined) return { success: true, data: undefined };
                    if (typeof v !== 'string' || !fn(v)) return { success: false };
                    return { success: true, data: v };
                  }
                })
              }),
              optional: () => ({
                safeParse: (v) => ({ success: v === undefined || typeof v === 'string', data: v })
              }),
              safeParse: (v) => ({ success: typeof v === 'string', data: v })
            };
            return obj;
          },
          number: () => {
            const numObj = {
              int: () => numObj,
              nonnegative: () => numObj,
              optional: () => ({
                safeParse: (v) => ({
                  success: v === undefined || (typeof v === 'number' && Number.isInteger(v) && v >= 0),
                  data: v
                })
              }),
              safeParse: (v) => ({
                success: typeof v === 'number' && Number.isInteger(v) && v >= 0,
                data: v
              })
            };
            return numObj;
          },
          object: (shape) => ({
            safeParse: (raw) => {
              if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { success: false };
              const data = {};
              for (const [k, s] of Object.entries(shape)) {
                const res = s.safeParse ? s.safeParse(raw[k]) : { success: true, data: raw[k] };
                if (!res.success) return { success: false };
                if (res.data !== undefined) data[k] = res.data;
              }
              return { success: true, data };
            }
          })
        };
      `),
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
