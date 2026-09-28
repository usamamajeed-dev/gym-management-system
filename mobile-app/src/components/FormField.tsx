import { forwardRef } from 'react';
import { StyleSheet, TextInput as NativeTextInput, View } from 'react-native';
import { HelperText, TextInput, TextInputProps } from 'react-native-paper';

import { useAppTheme } from '../theme/paperTheme';
import { radius } from '../theme/spacing';
import { fonts } from '../theme/fonts';

export interface FormFieldProps extends Omit<TextInputProps, 'error' | 'mode'> {
  /** Validation message; shows the field in the error state. */
  error?: string;
  /** Hint shown when there is no error. */
  hint?: string;
}

/** Outlined text input with its error (or hint) underneath. */
export const FormField = forwardRef<NativeTextInput, FormFieldProps>(function FormField(
  { error, hint, style, ...props },
  ref,
) {
  const { app } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <TextInput
        ref={ref}
        mode="outlined"
        error={!!error}
        outlineColor={app.border}
        activeOutlineColor={app.primary}
        outlineStyle={styles.outline}
        style={[styles.input, { backgroundColor: app.surface }, style]}
        contentStyle={styles.content}
        {...props}
      />
      {error ? (
        <HelperText type="error" visible style={styles.helper}>
          {error}
        </HelperText>
      ) : hint ? (
        <HelperText type="info" visible style={[styles.helper, { color: app.textMuted }]}>
          {hint}
        </HelperText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 6 },
  input: { fontSize: 15 },
  content: { fontFamily: fonts.regular },
  outline: { borderRadius: radius.md },
  helper: { fontFamily: fonts.medium, paddingHorizontal: 4 },
});
