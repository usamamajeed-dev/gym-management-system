import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, TextInput } from 'react-native-paper';

import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';
import { FormField } from './FormField';

interface DateFieldProps {
  label: string;
  /** "YYYY-MM-DD" or empty. */
  value: string;
  onChange: (value: string) => void;
  error?: string;
  maximumDate?: Date;
}

function toDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Date input backed by the native picker (Android dialog, iOS sheet).
 * The web build has no native picker, so there it's a plain YYYY-MM-DD field.
 */
export function DateField({ label, value, onChange, error, maximumDate }: DateFieldProps) {
  const { app } = useAppTheme();
  const [open, setOpen] = useState(false);
  const date = toDate(value);

  if (Platform.OS === 'web') {
    return (
      <FormField
        label={label}
        value={value}
        onChangeText={onChange}
        placeholder="YYYY-MM-DD"
        error={error}
        hint="Optional"
      />
    );
  }

  const handleChange = (event: DateTimePickerEvent, picked?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'set' && picked) onChange(format(picked, 'yyyy-MM-dd'));
  };

  return (
    <View>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label}>
        <View pointerEvents="none">
          <FormField
            label={label}
            value={date ? format(date, 'd MMM yyyy') : ''}
            editable={false}
            right={<TextInput.Icon icon="calendar-month-outline" />}
            error={error}
            hint="Optional"
          />
        </View>
      </Pressable>

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={date ?? new Date(1995, 0, 1)}
          mode="date"
          maximumDate={maximumDate}
          onChange={handleChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Portal>
          <Modal
            visible={open}
            onDismiss={() => setOpen(false)}
            contentContainerStyle={[styles.sheet, { backgroundColor: app.surface }]}
          >
            <DateTimePicker
              value={date ?? new Date(1995, 0, 1)}
              mode="date"
              display="inline"
              maximumDate={maximumDate}
              onChange={handleChange}
              accentColor={app.primary}
            />
            <Button mode="contained" onPress={() => setOpen(false)} style={styles.done}>
              Done
            </Button>
          </Modal>
        </Portal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { margin: spacing.xl, padding: spacing.lg, borderRadius: radius.xl },
  done: { marginTop: spacing.md, borderRadius: radius.md },
});
