import { z } from '@cs/utils/zod';

export type ActionResponse<S extends z.ZodType<any, any>> = Partial<{
  fields: Partial<z.infer<S>>;
  fieldErrors: Partial<z.infer<S>>;
  error: string;
  success: string;
}> | void;

export type ActionFunction<
  S extends z.ZodType<any, any>,
  T extends ActionResponse<S>
> = (
  data: z.infer<S>,
  entries: Record<string, FormDataEntryValue>
) => Promise<T>;

export type ActionFunctionWithUser = (
  prevState: any,
  formData: FormData,
  user: object | null
) => Promise<ActionResponse<any>>;
