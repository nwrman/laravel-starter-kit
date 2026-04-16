import { router } from '@inertiajs/react';
import type { StandardSchemaV1 } from '@tanstack/form-core';
import { standardSchemaValidators } from '@tanstack/form-core';
import { useForm as useTanstackForm } from '@tanstack/react-form';
import { useState } from 'react';

/** Matches Wayfinder's RouteDefinition shape */
interface RouteAction {
  url: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
}

interface UseInertiaFormOptions<TFormData extends Record<string, unknown>> {
  /** Zod v4 schema (implements Standard Schema) used for client-side validation on submit */
  schema: StandardSchemaV1<TFormData>;
  /** Initial field values */
  defaultValues: TFormData;
  /** Wayfinder `Controller.action()` result, or a plain `{ url, method }` object */
  action: RouteAction;
  /**
   * Extra data merged into the submission payload (outside TanStack Form state).
   * Useful for File uploads that don't fit into Zod schemas.
   * Called at submit time so it always reflects the latest state.
   */
  extraData?: () => Record<string, unknown>;
  options?: {
    preserveScroll?: boolean;
    /** Called after server errors are injected, e.g. to reset field values. */
    onError?: (errors: Record<string, string>) => void;
    /** Called after a successful submission (no validation errors). */
    onSuccess?: () => void;
  };
}

/**
 * Normalizes TanStack field errors (which may be Standard Schema issues or plain strings
 * from server injection) into the `{ message?: string }[]` shape expected by `<FieldError>`.
 */
export function normalizeFieldErrors(errors: unknown[]): Array<{ message?: string }> {
  return errors.map((e) => {
    if (typeof e === 'string') return { message: e };
    if (e && typeof e === 'object' && 'message' in e) return e as { message?: string };
    return { message: String(e) };
  });
}

/**
 * Bridge hook that combines TanStack Form (client-side state + Zod validation)
 * with Inertia's router (HTTP transport + server error handling).
 *
 * Validation behaviour:
 * - Before first submit: silent — no errors shown while typing
 * - After first failed submit: all fields go live — onChange re-validates until corrected
 * - Server 422 errors are injected via `form.setErrorMap({ onServer })` using the
 *   `GlobalFormValidationError` shape `{ fields }`. TanStack Form distributes each
 *   field error into that field's `errorMap.onServer` and automatically clears
 *   `onServer` errors on the next change, blur, or submit event.
 *
 * @returns `{ form, processing }` — the TanStack form instance and a processing boolean
 */
export function useInertiaForm<TFormData extends Record<string, unknown>>({
  schema,
  defaultValues,
  action,
  extraData,
  options,
}: UseInertiaFormOptions<TFormData>) {
  const [processing, setProcessing] = useState(false);

  const form = useTanstackForm({
    defaultValues,
    validators: {
      // Only run onChange validation after the user has attempted to submit at least once.
      // This keeps the form silent while the user fills it in for the first time, then
      // switches to live feedback once they hit Save and something is wrong.
      onChange: ({ value, formApi }) => {
        if (formApi.state.submissionAttempts === 0) return undefined;
        return standardSchemaValidators.validate({ value, validationSource: 'form' }, schema);
      },
      onSubmit: schema,
    },
    onSubmit: async ({ value }) => {
      const payload = { ...value, ...extraData?.() };

      // File uploads require multipart/form-data which only works with POST.
      // When the payload contains File instances and the intended method is not
      // POST, we use Laravel's method spoofing: send via router.post() with a
      // _method field so Laravel routes it to the correct controller method.
      const hasFiles = Object.values(payload).some((v) => v instanceof File);
      const method = hasFiles && action.method !== 'post' ? 'post' : action.method;
      const data =
        hasFiles && action.method !== 'post' ? { ...payload, _method: action.method } : payload;

      const visitOptions = {
        preserveScroll: options?.preserveScroll ?? true,
        onStart: () => setProcessing(true),
        onFinish: () => setProcessing(false),
        onError: (serverErrors: Record<string, string>) => {
          options?.onError?.(serverErrors);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          form.setErrorMap({ onServer: { fields: serverErrors } as any });
        },
        onSuccess: () => options?.onSuccess?.(),
      };

      // router.delete(url, options) — data goes inside options.data
      // router.post/put/patch(url, data, options) — data is the second argument
      if (method === 'delete') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.delete(action.url, { ...visitOptions, data: data as any });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (router[method] as any)(action.url, data, visitOptions);
      }
    },
  });

  return { form, processing };
}
