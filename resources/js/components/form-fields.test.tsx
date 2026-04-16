import type { AnyFieldApi } from '@tanstack/react-form';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CheckboxField,
  ComboboxField,
  PasswordField,
  SelectField,
  TextareaField,
  TextField,
  ToggleGroupField,
} from './form-fields';

function makeField(overrides?: Record<string, unknown>): AnyFieldApi {
  return {
    name: 'email',
    state: {
      value: '',
      meta: {
        isTouched: false,
        isValid: true,
        errors: [],
        errorMap: {},
      },
    },
    handleBlur: vi.fn(),
    handleChange: vi.fn(),
    ...overrides,
  } as unknown as AnyFieldApi;
}

function makeInvalidField(errors: unknown[] = ['Required']): AnyFieldApi {
  return makeField({
    state: { value: '', meta: { isTouched: true, isValid: false, errors, errorMap: {} } },
  });
}

function makeServerErrorField(error: string): AnyFieldApi {
  return makeField({
    state: {
      value: '',
      meta: {
        isTouched: false,
        isValid: false,
        errors: [error],
        errorMap: { onServer: error },
      },
    },
  });
}

describe('TextField', () => {
  it('renders the label and input', () => {
    render(<TextField field={makeField()} label="Email" />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders a description when provided', () => {
    render(<TextField field={makeField()} label="Email" description="Enter your email" />);

    expect(screen.getByText('Enter your email')).toBeInTheDocument();
  });

  it('does not render a description when omitted', () => {
    const { queryByText } = render(<TextField field={makeField()} label="Email" />);

    expect(queryByText('Enter your email')).not.toBeInTheDocument();
  });

  it('does not mark invalid when valid', () => {
    const { container } = render(<TextField field={makeField()} label="Email" />);

    expect(container.querySelector('[data-invalid="true"]')).not.toBeInTheDocument();
  });

  it('shows errors when touched and invalid', () => {
    render(<TextField field={makeInvalidField(['Required'])} label="Email" />);

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('shows server errors even when not touched', () => {
    render(
      <TextField field={makeServerErrorField('The email has already been taken.')} label="Email" />,
    );

    expect(screen.getByText('The email has already been taken.')).toBeInTheDocument();
  });

  it('calls handleChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TextField field={makeField({ handleChange })} label="Email" />);

    await user.type(screen.getByLabelText('Email'), 'a');

    expect(handleChange).toHaveBeenCalled();
  });
});

describe('ComboboxField', () => {
  const options = [
    { value: 'mx', label: 'México' },
    { value: 'us', label: 'Estados Unidos' },
    { value: 'ca', label: 'Canadá' },
  ];

  it('renders the label and input', () => {
    render(<ComboboxField field={makeField({ name: 'country' })} label="País" options={options} />);

    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('renders a custom placeholder', () => {
    render(
      <ComboboxField
        field={makeField({ name: 'country' })}
        label="País"
        options={options}
        placeholder="Buscar país..."
      />,
    );

    expect(screen.getByPlaceholderText('Buscar país...')).toBeInTheDocument();
  });

  it('renders a description when provided', () => {
    render(
      <ComboboxField
        field={makeField({ name: 'country' })}
        label="País"
        options={options}
        description="Selecciona tu país"
      />,
    );

    expect(screen.getByText('Selecciona tu país')).toBeInTheDocument();
  });

  it('shows errors when touched and invalid', () => {
    render(<ComboboxField field={makeInvalidField(['Required'])} label="País" options={options} />);

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('shows server errors even when not touched', () => {
    render(
      <ComboboxField
        field={makeServerErrorField('Invalid country')}
        label="País"
        options={options}
      />,
    );

    expect(screen.getByText('Invalid country')).toBeInTheDocument();
  });
});

describe('PasswordField', () => {
  it('renders an input with type password', () => {
    render(<PasswordField field={makeField({ name: 'password' })} label="Password" />);

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
  });

  it('renders a description when provided', () => {
    render(
      <PasswordField field={makeField()} label="Password" description="At least 8 characters" />,
    );

    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
  });

  it('does not render a description when omitted', () => {
    const { queryByText } = render(<PasswordField field={makeField()} label="Password" />);

    expect(queryByText('At least 8 characters')).not.toBeInTheDocument();
  });

  it('shows errors when touched and invalid', () => {
    render(<PasswordField field={makeInvalidField(['Too short'])} label="Password" />);

    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('shows server errors even when not touched', () => {
    render(
      <PasswordField field={makeServerErrorField('The password is incorrect.')} label="Password" />,
    );

    expect(screen.getByText('The password is incorrect.')).toBeInTheDocument();
  });

  it('toggles password visibility when eye button is clicked', async () => {
    const user = userEvent.setup();

    render(<PasswordField field={makeField({ name: 'password' })} label="Password" />);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(input).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(input).toHaveAttribute('type', 'password');
  });
});

describe('SelectField', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('renders the label and trigger', () => {
    render(<SelectField field={makeField()} label="Country" options={options} />);

    expect(screen.getByText('Country')).toBeInTheDocument();
  });

  it('renders a description when provided', () => {
    render(
      <SelectField
        field={makeField()}
        label="Country"
        options={options}
        description="Select your country"
      />,
    );

    expect(screen.getByText('Select your country')).toBeInTheDocument();
  });

  it('does not render a description when omitted', () => {
    const { queryByText } = render(
      <SelectField field={makeField()} label="Country" options={options} />,
    );

    expect(queryByText('Select your country')).not.toBeInTheDocument();
  });

  it('shows errors when touched and invalid', () => {
    render(
      <SelectField field={makeInvalidField(['Required'])} label="Country" options={options} />,
    );

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('shows server errors even when not touched', () => {
    render(
      <SelectField
        field={makeServerErrorField('Invalid country')}
        label="Country"
        options={options}
      />,
    );

    expect(screen.getByText('Invalid country')).toBeInTheDocument();
  });

  it('renders the placeholder text', () => {
    render(
      <SelectField field={makeField()} label="Country" options={options} placeholder="Pick one" />,
    );

    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });
});

describe('TextareaField', () => {
  it('renders the label and textarea', () => {
    render(<TextareaField field={makeField({ name: 'bio' })} label="Bio" />);

    expect(screen.getByLabelText('Bio')).toBeInTheDocument();
    expect(screen.getByLabelText('Bio').tagName).toBe('TEXTAREA');
  });

  it('renders a description when provided', () => {
    render(
      <TextareaField
        field={makeField({ name: 'bio' })}
        label="Bio"
        description="Tell us about yourself"
      />,
    );

    expect(screen.getByText('Tell us about yourself')).toBeInTheDocument();
  });

  it('does not render a description when omitted', () => {
    const { queryByText } = render(
      <TextareaField field={makeField({ name: 'bio' })} label="Bio" />,
    );

    expect(queryByText('Tell us about yourself')).not.toBeInTheDocument();
  });

  it('shows errors when touched and invalid', () => {
    render(<TextareaField field={makeInvalidField(['Too short'])} label="Bio" />);

    expect(screen.getByText('Too short')).toBeInTheDocument();
  });

  it('shows server errors even when not touched', () => {
    render(<TextareaField field={makeServerErrorField('Content is inappropriate.')} label="Bio" />);

    expect(screen.getByText('Content is inappropriate.')).toBeInTheDocument();
  });

  it('calls handleChange when user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<TextareaField field={makeField({ name: 'bio', handleChange })} label="Bio" />);

    await user.type(screen.getByLabelText('Bio'), 'a');

    expect(handleChange).toHaveBeenCalled();
  });

  it('calls handleBlur when textarea loses focus', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();

    render(<TextareaField field={makeField({ name: 'bio', handleBlur })} label="Bio" />);

    await user.click(screen.getByLabelText('Bio'));
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });
});

describe('CheckboxField', () => {
  it('renders the label and checkbox', () => {
    render(
      <CheckboxField
        field={makeField({
          name: 'terms',
          state: {
            value: false,
            meta: { isTouched: false, isValid: true, errors: [], errorMap: {} },
          },
        })}
        label="Accept terms"
      />,
    );

    expect(screen.getByText('Accept terms')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders a description when provided', () => {
    render(
      <CheckboxField
        field={makeField({
          name: 'terms',
          state: {
            value: false,
            meta: { isTouched: false, isValid: true, errors: [], errorMap: {} },
          },
        })}
        label="Accept terms"
        description="You must accept to continue"
      />,
    );

    expect(screen.getByText('You must accept to continue')).toBeInTheDocument();
  });

  it('shows errors when touched and invalid', () => {
    render(<CheckboxField field={makeInvalidField(['Must accept'])} label="Accept terms" />);

    expect(screen.getByText('Must accept')).toBeInTheDocument();
  });

  it('calls handleChange when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <CheckboxField
        field={makeField({
          name: 'terms',
          handleChange,
          state: {
            value: false,
            meta: { isTouched: false, isValid: true, errors: [], errorMap: {} },
          },
        })}
        label="Accept terms"
      />,
    );

    await user.click(screen.getByRole('checkbox'));

    expect(handleChange).toHaveBeenCalled();
  });
});

describe('ToggleGroupField', () => {
  const options = [
    { value: 'fisica', label: 'Persona Física' },
    { value: 'moral', label: 'Persona Moral' },
  ];

  it('renders the label and toggle buttons', () => {
    render(
      <ToggleGroupField
        field={makeField({ name: 'tipo' })}
        label="Tipo de persona"
        options={options}
      />,
    );

    expect(screen.getByText('Tipo de persona')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Persona Física' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Persona Moral' })).toBeInTheDocument();
  });

  it('renders a description when provided', () => {
    render(
      <ToggleGroupField
        field={makeField({ name: 'tipo' })}
        label="Tipo de persona"
        options={options}
        description="Select one"
      />,
    );

    expect(screen.getByText('Select one')).toBeInTheDocument();
  });

  it('shows errors when touched and invalid', () => {
    render(
      <ToggleGroupField
        field={makeInvalidField(['Required'])}
        label="Tipo de persona"
        options={options}
      />,
    );

    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('calls handleChange when a toggle is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <ToggleGroupField
        field={makeField({ name: 'tipo', handleChange })}
        label="Tipo de persona"
        options={options}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Persona Física' }));

    expect(handleChange).toHaveBeenCalled();
  });
});
