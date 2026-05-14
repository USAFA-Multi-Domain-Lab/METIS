import type { ZodObject, ZodOptional, ZodType } from 'zod'

/**
 * Converts a regular interface to a Zod object type.
 */
export type TZodify<T extends object> = ZodObject<
  Required<{
    [K in keyof T]: Required<T>[K] extends Array<infer U>
      ? {} extends Pick<T, K>
        ? ZodOptional<ZodType<Required<T>[K]>>
        : ZodType<Required<T>[K]>
      : Required<T>[K] extends Record<string, any>
        ? {} extends Pick<T, K>
          ? ZodOptional<ZodType<Required<T>[K]>>
          : ZodType<Required<T>[K]>
        : Required<T>[K] extends object
          ? {} extends Pick<T, K>
            ? ZodOptional<TZodify<Required<T>[K]>>
            : TZodify<Required<T>[K]>
          : {} extends Pick<T, K>
            ? ZodOptional<ZodType<T[K]>>
            : ZodType<T[K]>
  }>
>
