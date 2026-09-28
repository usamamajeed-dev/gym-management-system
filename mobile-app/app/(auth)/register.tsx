import { MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, FieldErrors, useForm, useWatch } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, SegmentedButtons, TextInput } from 'react-native-paper';

import { useAuth } from '@/auth/AuthContext';
import { RegisterFormInput, registerSchema, RegisterFormValues } from '@/auth/registerSchema';
import { AuthHeader } from '@/components/AuthHeader';
import { DateField } from '@/components/DateField';
import { FormField } from '@/components/FormField';
import { PasswordChecklist } from '@/components/PasswordChecklist';
import { StatusBanner } from '@/components/StatusBanner';
import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { fieldMessage, toApiError } from '@/utils/errors';

type FieldName = keyof RegisterFormInput;

/** Order used to scroll to the first field with an error. */
const FIELD_ORDER: FieldName[] = [
  'name',
  'email',
  'phone',
  'password',
  'password_confirmation',
  'date_of_birth',
  'gender',
  'address',
  'emergency_contact_name',
  'emergency_contact_phone',
];
const OPTIONAL_FIELDS: FieldName[] = [
  'date_of_birth',
  'gender',
  'address',
  'emergency_contact_name',
  'emergency_contact_phone',
];

export default function RegisterScreen() {
  const { app } = useAppTheme();
  const { register } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const positions = useRef<Partial<Record<FieldName, number>>>({});
  const [showMore, setShowMore] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
      date_of_birth: '',
      address: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
    },
  });

  const password = useWatch({ control, name: 'password' });

  const track = (field: FieldName) => (y: number) => {
    positions.current[field] = y;
  };

  const scrollToFirstError = (fieldErrors: FieldErrors<RegisterFormInput>) => {
    const first = FIELD_ORDER.find((f) => fieldErrors[f]);
    if (!first) return;
    if (OPTIONAL_FIELDS.includes(first)) setShowMore(true);
    const y = positions.current[first];
    if (y !== undefined) scrollRef.current?.scrollTo({ y: Math.max(0, y + 220), animated: true });
  };

  const onSubmit = () =>
    handleSubmit(
      async (values) => {
        setFormError(null);
        try {
          const message = await register({
            name: values.name,
            email: values.email,
            phone: values.phone,
            password: values.password,
            password_confirmation: values.password_confirmation,
            date_of_birth: values.date_of_birth || null,
            gender: values.gender ?? null,
            address: values.address || null,
            emergency_contact_name: values.emergency_contact_name || null,
            emergency_contact_phone: values.emergency_contact_phone || null,
          });
          router.replace({ pathname: '/pending', params: { message, email: values.email } });
        } catch (error) {
          const apiError = toApiError(error);
          if (apiError.status === 422 && apiError.errors) {
            const serverErrors: FieldErrors<RegisterFormInput> = {};
            for (const field of Object.keys(apiError.errors)) {
              if (FIELD_ORDER.includes(field as FieldName)) {
                const message = fieldMessage(apiError, field);
                setError(field as FieldName, { type: 'server', message });
                serverErrors[field as FieldName] = { type: 'server', message };
              }
            }
            scrollToFirstError(serverErrors);
            return;
          }
          setFormError(apiError.message);
          scrollRef.current?.scrollTo({ y: 0, animated: true });
        }
      },
      (fieldErrors) => scrollToFirstError(fieldErrors),
    )();

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: app.background }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader title="Join the gym" subtitle="Register now. You can log in once the gym approves you." />

        <View style={[styles.card, { backgroundColor: app.surface, borderColor: app.border }]}>
          {formError ? <StatusBanner tone="danger" message={formError} /> : null}

          <Text style={[typography.overline, styles.section, { color: app.textFaint }]}>Your details</Text>

          <View onLayout={(e) => track('name')(e.nativeEvent.layout.y)}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  testID="register-name"
                  label="Full name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoComplete="name"
                  textContentType="name"
                  left={<TextInput.Icon icon="account-outline" color={app.textFaint} />}
                  error={errors.name?.message}
                />
              )}
            />
          </View>

          <View onLayout={(e) => track('email')(e.nativeEvent.layout.y)}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  testID="register-email"
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  left={<TextInput.Icon icon="email-outline" color={app.textFaint} />}
                  error={errors.email?.message}
                />
              )}
            />
          </View>

          <View onLayout={(e) => track('phone')(e.nativeEvent.layout.y)}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  testID="register-phone"
                  label="Phone"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  placeholder="+14155552671"
                  left={<TextInput.Icon icon="phone-outline" color={app.textFaint} />}
                  hint="International format, e.g. +14155552671"
                  error={errors.phone?.message}
                />
              )}
            />
          </View>

          <Text style={[typography.overline, styles.section, { color: app.textFaint }]}>Password</Text>

          <View onLayout={(e) => track('password')(e.nativeEvent.layout.y)}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  testID="register-password"
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  left={<TextInput.Icon icon="lock-outline" color={app.textFaint} />}
                  right={
                    <TextInput.Icon
                      icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      onPress={() => setShowPassword((v) => !v)}
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    />
                  }
                  error={errors.password?.message}
                />
              )}
            />
          </View>
          <PasswordChecklist password={password ?? ''} />

          <View onLayout={(e) => track('password_confirmation')(e.nativeEvent.layout.y)}>
            <Controller
              control={control}
              name="password_confirmation"
              render={({ field: { onChange, onBlur, value } }) => (
                <FormField
                  testID="register-confirm"
                  label="Confirm password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  left={<TextInput.Icon icon="lock-check-outline" color={app.textFaint} />}
                  error={errors.password_confirmation?.message}
                />
              )}
            />
          </View>

          <Pressable
            onPress={() => setShowMore((v) => !v)}
            style={[styles.more, { borderColor: app.border, backgroundColor: app.surfaceMuted }]}
            accessibilityRole="button"
            accessibilityState={{ expanded: showMore }}
          >
            <MaterialCommunityIcons name="card-account-details-outline" size={20} color={app.primary} />
            <View style={styles.flex}>
              <Text style={[typography.subheading, { color: app.text }]}>More details</Text>
              <Text style={[typography.caption, { color: app.textMuted }]}>
                Optional · birthday, gender, address, emergency contact
              </Text>
            </View>
            <MaterialCommunityIcons name={showMore ? 'chevron-up' : 'chevron-down'} size={22} color={app.textMuted} />
          </Pressable>

          {showMore ? (
            <View style={styles.moreBody}>
              <View onLayout={(e) => track('date_of_birth')(e.nativeEvent.layout.y)}>
                <Controller
                  control={control}
                  name="date_of_birth"
                  render={({ field: { onChange, value } }) => (
                    <DateField
                      label="Date of birth"
                      value={value ?? ''}
                      onChange={onChange}
                      maximumDate={new Date()}
                      error={errors.date_of_birth?.message}
                    />
                  )}
                />
              </View>

              <Text style={[typography.label, styles.fieldLabel, { color: app.textSecondary }]}>Gender</Text>
              <Controller
                control={control}
                name="gender"
                render={({ field: { onChange, value } }) => (
                  <SegmentedButtons
                    theme={{ colors: { secondaryContainer: app.primarySoft, onSecondaryContainer: app.primary } }}
                    value={value ?? ''}
                    onValueChange={(v) => onChange(v === value ? undefined : v)}
                    style={styles.segments}
                    buttons={[
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' },
                    ]}
                  />
                )}
              />

              <View onLayout={(e) => track('address')(e.nativeEvent.layout.y)}>
                <Controller
                  control={control}
                  name="address"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormField
                      label="Address"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoComplete="street-address"
                      error={errors.address?.message}
                    />
                  )}
                />
              </View>

              <View onLayout={(e) => track('emergency_contact_name')(e.nativeEvent.layout.y)}>
                <Controller
                  control={control}
                  name="emergency_contact_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormField
                      label="Emergency contact name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.emergency_contact_name?.message}
                    />
                  )}
                />
              </View>

              <View onLayout={(e) => track('emergency_contact_phone')(e.nativeEvent.layout.y)}>
                <Controller
                  control={control}
                  name="emergency_contact_phone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <FormField
                      label="Emergency contact phone"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="phone-pad"
                      placeholder="+14155550000"
                      error={errors.emergency_contact_phone?.message}
                    />
                  )}
                />
              </View>
            </View>
          ) : null}

          <Button
            mode="contained"
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.submit}
            contentStyle={styles.submitContent}
            labelStyle={styles.submitLabel}
          >
            {isSubmitting ? 'Submitting…' : 'Create account'}
          </Button>

          <View style={styles.loginRow}>
            <Text style={[typography.bodySmall, { color: app.textMuted }]}>Already a member?</Text>
            <Link href="/login" replace asChild>
              <Button compact mode="text">
                Log in
              </Button>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: spacing.xxxl },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: -32,
    padding: spacing.xl,
    gap: spacing.xs,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  section: { marginTop: spacing.sm, marginBottom: spacing.xs },
  more: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  moreBody: { marginTop: spacing.md, gap: spacing.xs },
  fieldLabel: { marginBottom: spacing.xs, marginTop: spacing.xs },
  segments: { marginBottom: spacing.md },
  submit: { marginTop: spacing.lg, borderRadius: radius.md },
  submitContent: { height: 50 },
  submitLabel: { fontSize: 16 },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
});
