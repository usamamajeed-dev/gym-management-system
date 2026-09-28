import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, TextInput } from 'react-native-paper';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthContext';
import { LoginErrorView, loginErrorView } from '@/auth/loginErrorView';
import { AuthHeader } from '@/components/AuthHeader';
import { FormField } from '@/components/FormField';
import { StatusBanner } from '@/components/StatusBanner';
import { useAppTheme } from '@/theme/paperTheme';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { fieldMessage, toApiError } from '@/utils/errors';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});
type LoginValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { app } = useAppTheme();
  const { login, notice, clearNotice } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [failure, setFailure] = useState<LoginErrorView | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setFailure(null);
    clearNotice();
    try {
      await login(values.email, values.password);
      // The (auth) layout redirects to the tabs once the member is signed in.
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.status === 422 && apiError.errors) {
        for (const field of Object.keys(apiError.errors)) {
          if (field === 'email' || field === 'password') setError(field, { message: fieldMessage(apiError, field) });
        }
        return;
      }
      setFailure(loginErrorView(apiError));
    }
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={{ backgroundColor: app.background }}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <AuthHeader title="Welcome back" subtitle="Log in to see your gym's hours, events and news." />

        <View style={[styles.card, { backgroundColor: app.surface, borderColor: app.border }]}>
          {notice ? <StatusBanner tone="info" message={notice} /> : null}
          {failure?.kind === 'banner' ? (
            <StatusBanner tone={failure.tone} title={failure.title} message={failure.message} />
          ) : null}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Email"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="username"
                left={<TextInput.Icon icon="email-outline" color={app.textFaint} />}
                error={errors.email?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <FormField
                label="Password"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                onSubmitEditing={onSubmit}
                returnKeyType="go"
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

          {failure?.kind === 'inline' ? (
            <Text style={[typography.label, styles.inlineError, { color: app.danger }]} accessibilityRole="alert">
              {failure.message}
            </Text>
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
            {isSubmitting ? 'Logging in…' : 'Log in'}
          </Button>

          <View style={styles.divider}>
            <View style={[styles.line, { backgroundColor: app.border }]} />
            <Text style={[typography.caption, { color: app.textFaint }]}>New to the gym?</Text>
            <View style={[styles.line, { backgroundColor: app.border }]} />
          </View>

          <Link href="/register" asChild>
            <Button
              mode="outlined"
              style={styles.secondary}
              contentStyle={styles.submitContent}
              icon="account-plus-outline"
            >
              Create an account
            </Button>
          </Link>
        </View>

        <Text style={[typography.caption, styles.footnote, { color: app.textFaint }]}>
          New accounts can log in once the gym approves them.
        </Text>
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
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  inlineError: { marginTop: -2, paddingHorizontal: 4 },
  submit: { marginTop: spacing.sm, borderRadius: radius.md },
  submitContent: { height: 50 },
  submitLabel: { fontSize: 16 },
  secondary: { borderRadius: radius.md },
  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  footnote: { textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.xxl },
});
