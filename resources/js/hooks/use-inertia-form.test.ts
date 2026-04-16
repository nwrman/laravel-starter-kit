import { router } from '@inertiajs/react';
import { act, renderHook } from '@testing-library/react';
import * as z from 'zod';
import { normalizeFieldErrors, useInertiaForm } from './use-inertia-form';

const mockRouter = vi.mocked(router);

// Capture the onError callback router receives so tests can trigger server errors
let capturedOnError: ((errors: Record<string, string>) => void) | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  capturedOnError = undefined;

  mockRouter.post.mockImplementation((_url, _data, options: any) => {
    capturedOnError = options?.onError;
  });
});

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
});

const action = { url: '/settings/profile', method: 'post' as const };

describe('normalizeFieldErrors', () => {
  it('wraps plain strings in a message object', () => {
    expect(normalizeFieldErrors(['Required'])).toEqual([{ message: 'Required' }]);
  });

  it('passes through objects that already have a message property', () => {
    const err = { message: 'Too short', path: ['name'] };
    expect(normalizeFieldErrors([err])).toEqual([err]);
  });

  it('falls back to String() for unrecognised shapes', () => {
    expect(normalizeFieldErrors([42])).toEqual([{ message: '42' }]);
    expect(normalizeFieldErrors([null])).toEqual([{ message: 'null' }]);
  });
});

describe('useInertiaForm', () => {
  it('sends current TanStack values via router when Zod validation passes', async () => {
    const { result } = renderHook(() =>
      useInertiaForm({ schema, defaultValues: { name: '', email: '' }, action }),
    );

    await act(async () => {
      result.current.form.setFieldValue('name', 'Jonathan');
      result.current.form.setFieldValue('email', 'jonathan@example.com');
    });

    await act(async () => {
      await result.current.form.handleSubmit();
    });

    expect(mockRouter.post).toHaveBeenCalledWith(
      '/settings/profile',
      { name: 'Jonathan', email: 'jonathan@example.com' },
      expect.objectContaining({ preserveScroll: true }),
    );
  });

  it('does not call router when Zod validation fails', async () => {
    const { result } = renderHook(() =>
      useInertiaForm({ schema, defaultValues: { name: '', email: '' }, action }),
    );

    await act(async () => {
      result.current.form.setFieldValue('name', 'J'); // too short
      result.current.form.setFieldValue('email', 'not-an-email');
    });

    await act(async () => {
      await result.current.form.handleSubmit();
    });

    expect(mockRouter.post).not.toHaveBeenCalled();
  });

  it('maps server 422 errors into TanStack field meta', async () => {
    const { result } = renderHook(() =>
      useInertiaForm({ schema, defaultValues: { name: '', email: '' }, action }),
    );

    await act(async () => {
      result.current.form.setFieldValue('name', 'Jonathan');
      result.current.form.setFieldValue('email', 'jonathan@example.com');
    });

    await act(async () => {
      await result.current.form.handleSubmit();
    });

    expect(mockRouter.post).toHaveBeenCalled();

    // Simulate server responding with 422 errors
    await act(async () => {
      capturedOnError?.({ email: 'The email has already been taken.' });
    });

    const emailField = result.current.form.getFieldMeta('email');
    expect(emailField?.errors).toContain('The email has already been taken.');
  });

  it('clears server errors when the user modifies a field value', async () => {
    const { result } = renderHook(() =>
      useInertiaForm({ schema, defaultValues: { name: '', email: '' }, action }),
    );

    // Fill valid values and submit
    await act(async () => {
      result.current.form.setFieldValue('name', 'Jonathan');
      result.current.form.setFieldValue('email', 'jonathan@example.com');
    });

    await act(async () => {
      await result.current.form.handleSubmit();
    });

    // Simulate server 422 error
    await act(async () => {
      capturedOnError?.({ email: 'The email has already been taken.' });
    });

    expect(result.current.form.getFieldMeta('email')?.errorMap.onServer).toBe(
      'The email has already been taken.',
    );

    // User corrects the email — server error should be cleared
    await act(async () => {
      result.current.form.setFieldValue('email', 'new@example.com');
    });

    expect(result.current.form.getFieldMeta('email')?.errorMap.onServer).toBeUndefined();
  });

  it('allows resubmission after server errors are cleared by user edits', async () => {
    const { result } = renderHook(() =>
      useInertiaForm({ schema, defaultValues: { name: '', email: '' }, action }),
    );

    // Fill valid values and submit
    await act(async () => {
      result.current.form.setFieldValue('name', 'Jonathan');
      result.current.form.setFieldValue('email', 'jonathan@example.com');
    });

    await act(async () => {
      await result.current.form.handleSubmit();
    });

    expect(mockRouter.post).toHaveBeenCalledTimes(1);

    // Simulate server 422 error
    await act(async () => {
      capturedOnError?.({ email: 'The email has already been taken.' });
    });

    // User corrects the value
    await act(async () => {
      result.current.form.setFieldValue('email', 'new@example.com');
    });

    // Resubmit — should work because onServer error was cleared
    await act(async () => {
      await result.current.form.handleSubmit();
    });

    expect(mockRouter.post).toHaveBeenCalledTimes(2);
    expect(mockRouter.post).toHaveBeenLastCalledWith(
      '/settings/profile',
      { name: 'Jonathan', email: 'new@example.com' },
      expect.objectContaining({ preserveScroll: true }),
    );
  });

  it('sets processing true on start and false on finish', async () => {
    let capturedOnStart: (() => void) | undefined;
    let capturedOnFinish: (() => void) | undefined;

    mockRouter.post.mockImplementation((_url, _data, options: any) => {
      capturedOnStart = options?.onStart;
      capturedOnFinish = options?.onFinish;
    });

    const { result } = renderHook(() =>
      useInertiaForm({ schema, defaultValues: { name: '', email: '' }, action }),
    );

    await act(async () => {
      result.current.form.setFieldValue('name', 'Jonathan');
      result.current.form.setFieldValue('email', 'jonathan@example.com');
      await result.current.form.handleSubmit();
    });

    expect(result.current.processing).toBe(false);

    act(() => capturedOnStart?.());
    expect(result.current.processing).toBe(true);

    act(() => capturedOnFinish?.());
    expect(result.current.processing).toBe(false);
  });

  it('calls options.onError before injecting server errors', async () => {
    let capturedOnError: ((errors: Record<string, string>) => void) | undefined;

    mockRouter.post.mockImplementation((_url, _data, options: any) => {
      capturedOnError = options?.onError;
    });

    const onError = vi.fn();
    const { result } = renderHook(() =>
      useInertiaForm({
        schema,
        defaultValues: { name: '', email: '' },
        action,
        options: { onError },
      }),
    );

    await act(async () => {
      result.current.form.setFieldValue('name', 'Jonathan');
      result.current.form.setFieldValue('email', 'jonathan@example.com');
      await result.current.form.handleSubmit();
    });

    await act(async () => {
      capturedOnError?.({ email: 'The email has already been taken.' });
    });

    expect(onError).toHaveBeenCalledWith({ email: 'The email has already been taken.' });
    // Server error is still injected into field meta regardless
    expect(result.current.form.getFieldMeta('email')?.errorMap.onServer).toBe(
      'The email has already been taken.',
    );
  });

  it('preserves server errors when onError resets the form', async () => {
    let capturedOnError: ((errors: Record<string, string>) => void) | undefined;

    mockRouter.post.mockImplementation((_url, _data, options: any) => {
      capturedOnError = options?.onError;
    });

    // This simulates the password form pattern: onError calls form.reset()
    const { result } = renderHook(() =>
      useInertiaForm({
        schema,
        defaultValues: { name: '', email: '' },
        action,
        options: { onError: () => result.current.form.reset() },
      }),
    );

    // Fill fields and submit
    await act(async () => {
      result.current.form.setFieldValue('name', 'Jonathan');
      result.current.form.setFieldValue('email', 'jonathan@example.com');
      await result.current.form.handleSubmit();
    });

    // Simulate server 422 error — onError will reset() then setErrorMap injects errors
    await act(async () => {
      capturedOnError?.({ email: 'The email has already been taken.' });
    });

    // Field values should be cleared by reset()
    expect(result.current.form.getFieldValue('name')).toBe('');
    expect(result.current.form.getFieldValue('email')).toBe('');

    // Server errors should survive the reset because setErrorMap runs after onError
    expect(result.current.form.getFieldMeta('email')?.errorMap.onServer).toBe(
      'The email has already been taken.',
    );
  });

  it('calls options.onSuccess after successful submission', async () => {
    let capturedOnSuccess: (() => void) | undefined;

    mockRouter.post.mockImplementation((_url, _data, options: any) => {
      capturedOnSuccess = options?.onSuccess;
    });

    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useInertiaForm({
        schema,
        defaultValues: { name: '', email: '' },
        action,
        options: { onSuccess },
      }),
    );

    await act(async () => {
      result.current.form.setFieldValue('name', 'Jonathan');
      result.current.form.setFieldValue('email', 'jonathan@example.com');
      await result.current.form.handleSubmit();
    });

    await act(async () => {
      capturedOnSuccess?.();
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });
});
