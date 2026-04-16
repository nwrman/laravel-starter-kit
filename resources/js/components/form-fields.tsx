import type { AnyFieldApi } from '@tanstack/react-form';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { type ComponentProps, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { normalizeFieldErrors } from '@/hooks/use-inertia-form';

type FieldApi = AnyFieldApi;

function hasServerError(field: FieldApi): boolean {
  return field.state.meta.errorMap.onServer !== undefined;
}

function getIsInvalid(field: FieldApi): boolean {
  return hasServerError(field) || (field.state.meta.isTouched && !field.state.meta.isValid);
}

// ─── TextField ────────────────────────────────────────────────────────────────

type TextFieldProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onBlur' | 'onChange' | 'aria-invalid' | 'id'
> & {
  field: FieldApi;
  label: string;
  description?: string;
};

export function TextField({ field, label, description, ...inputProps }: TextFieldProps) {
  const isInvalid = getIsInvalid(field);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...inputProps}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={normalizeFieldErrors(field.state.meta.errors)} />}
    </Field>
  );
}

// ─── SelectField ──────────────────────────────────────────────────────────────

type SelectOption = { value: string; label: string };

type SelectFieldProps = {
  field: FieldApi;
  label: string;
  placeholder?: string;
  description?: string;
  options: SelectOption[];
  className?: string;
};

export function SelectField({
  field,
  label,
  placeholder = 'Selecciona una opción',
  description,
  options,
  className,
}: SelectFieldProps) {
  const isInvalid = getIsInvalid(field);

  const items = [{ label: placeholder, value: null as unknown as string }, ...options];

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        items={items}
        value={(field.state.value as string) || null}
        onValueChange={(value: string | null) => {
          field.handleChange(value ?? '');
        }}
      >
        <SelectTrigger className="w-full" aria-invalid={isInvalid}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} side="bottom">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={normalizeFieldErrors(field.state.meta.errors)} />}
    </Field>
  );
}

// ─── TextareaField ────────────────────────────────────────────────────────────

type TextareaFieldProps = Omit<
  ComponentProps<'textarea'>,
  'value' | 'onBlur' | 'onChange' | 'aria-invalid' | 'id'
> & {
  field: FieldApi;
  label: string;
  description?: string;
};

export function TextareaField({ field, label, description, ...textareaProps }: TextareaFieldProps) {
  const isInvalid = getIsInvalid(field);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Textarea
        id={field.name}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        {...textareaProps}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={normalizeFieldErrors(field.state.meta.errors)} />}
    </Field>
  );
}

// ─── CheckboxField ────────────────────────────────────────────────────────────

type CheckboxFieldProps = {
  field: FieldApi;
  label: string;
  description?: string;
};

export function CheckboxField({ field, label, description }: CheckboxFieldProps) {
  const isInvalid = getIsInvalid(field);

  return (
    <Field data-invalid={isInvalid} orientation="horizontal">
      <Checkbox
        id={field.name}
        checked={field.state.value as boolean}
        onCheckedChange={(checked) => field.handleChange(checked)}
        aria-invalid={isInvalid}
      />
      <FieldContent>
        <FieldLabel htmlFor={field.name} className="font-normal">
          {label}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError errors={normalizeFieldErrors(field.state.meta.errors)} />}
      </FieldContent>
    </Field>
  );
}

// ─── ToggleGroupField ─────────────────────────────────────────────────────────

type ToggleGroupFieldProps = {
  field: FieldApi;
  label: string;
  description?: string;
  options: Array<{ value: string; label: string }>;
};

export function ToggleGroupField({ field, label, description, options }: ToggleGroupFieldProps) {
  const isInvalid = getIsInvalid(field);
  const currentValue = field.state.value as string;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel id={`${field.name}-label`}>{label}</FieldLabel>
      <ToggleGroup
        aria-labelledby={`${field.name}-label`}
        value={currentValue ? [currentValue] : []}
        onValueChange={(values: string[]) => {
          field.handleChange(values[0] ?? '');
        }}
        spacing={2}
        variant="outline"
      >
        {options.map((option) => (
          <ToggleGroupItem key={option.value} value={option.value}>
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={normalizeFieldErrors(field.state.meta.errors)} />}
    </Field>
  );
}

// ─── ComboboxField ────────────────────────────────────────────────────────────

type ComboboxOption = { value: string; label: string };

type ComboboxFieldProps = {
  field: FieldApi;
  label: string;
  placeholder?: string;
  description?: string;
  options: ComboboxOption[];
  className?: string;
};

export function ComboboxField({
  field,
  label,
  placeholder = 'Buscar...',
  description,
  options,
  className,
}: ComboboxFieldProps) {
  const isInvalid = getIsInvalid(field);

  return (
    <Field data-invalid={isInvalid} className={className}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Combobox
        items={options}
        itemToStringValue={(option: ComboboxOption) => option.label}
        value={options.find((o) => o.value === (field.state.value as string)) ?? null}
        onValueChange={(option: ComboboxOption | null) => {
          field.handleChange(option?.value ?? '');
        }}
      >
        <ComboboxInput id={field.name} placeholder={placeholder} aria-invalid={isInvalid} />
        <ComboboxContent>
          <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
          <ComboboxList>
            {(option: ComboboxOption) => (
              <ComboboxItem key={option.value} value={option}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={normalizeFieldErrors(field.state.meta.errors)} />}
    </Field>
  );
}

// ─── PasswordField ────────────────────────────────────────────────────────────

type PasswordFieldProps = Omit<
  ComponentProps<'input'>,
  'value' | 'onBlur' | 'onChange' | 'aria-invalid' | 'id' | 'type'
> & {
  field: FieldApi;
  label: string;
  description?: string;
};

export function PasswordField({ field, label, description, ...inputProps }: PasswordFieldProps) {
  const isInvalid = getIsInvalid(field);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          id={field.name}
          type={showPassword ? 'text' : 'password'}
          value={field.state.value as string}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          {...inputProps}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            onClick={() => setShowPassword((prev) => !prev)}
            size="icon-xs"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={normalizeFieldErrors(field.state.meta.errors)} />}
    </Field>
  );
}
