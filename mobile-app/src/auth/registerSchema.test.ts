import { registerSchema } from './registerSchema';

const valid = {
  name: 'Jane Doe',
  email: 'Jane@Example.com',
  phone: '+1 (415) 555-2671',
  password: 'Secret@123',
  password_confirmation: 'Secret@123',
};

function errorsFor(input: object): Record<string, string[] | undefined> {
  const result = registerSchema.safeParse(input);
  return result.success ? {} : (result.error.flatten().fieldErrors as Record<string, string[] | undefined>);
}

describe('registerSchema', () => {
  it('accepts a valid registration and normalises email and phone', () => {
    const result = registerSchema.parse(valid);

    expect(result.email).toBe('jane@example.com');
    expect(result.phone).toBe('+14155552671');
  });

  it('rejects a weak password', () => {
    expect(errorsFor({ ...valid, password: 'password', password_confirmation: 'password' }).password).toBeDefined();
  });

  it('rejects a phone number that is not in international format', () => {
    expect(errorsFor({ ...valid, phone: '0300-1234567' }).phone).toBeDefined();
  });

  it('rejects a mismatched confirmation', () => {
    expect(errorsFor({ ...valid, password_confirmation: 'Other@1234' }).password_confirmation).toEqual([
      'The passwords do not match.',
    ]);
  });

  it('validates the optional emergency phone only when given', () => {
    expect(errorsFor({ ...valid, emergency_contact_phone: '' }).emergency_contact_phone).toBeUndefined();
    expect(errorsFor({ ...valid, emergency_contact_phone: '12345' }).emergency_contact_phone).toBeDefined();
  });
});
