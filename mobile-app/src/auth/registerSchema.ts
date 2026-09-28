import { z } from 'zod';

/** Same rules as the API: international (E.164) phone numbers, e.g. +14155552671. */
export const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

/** Keep only digits and "+", like the API does before validating. */
export function normalisePhone(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { key: 'upper', label: 'An uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { key: 'lower', label: 'A lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { key: 'digit', label: 'A number', test: (v: string) => /\d/.test(v) },
  { key: 'special', label: 'A special character', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
] as const;

const optionalText = (max: number, label: string) =>
  z.string().trim().max(max, `${label} must be at most ${max} characters.`).optional().or(z.literal(''));

const phone = z
  .string()
  .transform(normalisePhone)
  .refine((v) => PHONE_REGEX.test(v), 'Enter the number in international format, e.g. +14155552671.');

/** Mirrors the API's registration rules so most mistakes are caught before submitting. */
export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(100, 'Name is too long.'),
    email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(255),
    phone,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.')
      .refine(
        (v) => PASSWORD_RULES.every((rule) => rule.test(v)),
        'Use upper and lower case letters, a number and a symbol.',
      ),
    password_confirmation: z.string(),
    date_of_birth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a valid date.')
      .optional()
      .or(z.literal('')),
    gender: z.enum(['male', 'female', 'other']).optional(),
    address: optionalText(255, 'Address'),
    emergency_contact_name: optionalText(100, 'Contact name'),
    emergency_contact_phone: z
      .string()
      .transform(normalisePhone)
      .refine((v) => v === '' || PHONE_REGEX.test(v), 'Enter the number in international format, e.g. +14155552671.')
      .optional(),
  })
  .refine((v) => v.password === v.password_confirmation, {
    message: 'The passwords do not match.',
    path: ['password_confirmation'],
  });

export type RegisterFormInput = z.input<typeof registerSchema>;
export type RegisterFormValues = z.output<typeof registerSchema>;
