import * as WebBrowser from 'expo-web-browser';
import { Fragment, ReactNode, useMemo } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';

import { useAppTheme } from '../theme/paperTheme';
import { radius, spacing } from '../theme/spacing';
import { fonts } from '../theme/fonts';
import { typography } from '../theme/typography';
import { HtmlNode, parseHtml } from '../utils/html';

/** Renders a sanitised news/policy body. Links open in the system browser. */
export function HtmlBody({ html }: { html: string }) {
  const { app } = useAppTheme();
  const nodes = useMemo(() => parseHtml(html), [html]);

  const colors = {
    text: app.textSecondary,
    strong: app.text,
    link: app.primary,
    quote: app.primary,
    quoteBg: app.primarySoft,
  };

  const inline = (items: HtmlNode[], keyPrefix: string): ReactNode[] =>
    items.map((node, i) => {
      const key = `${keyPrefix}-${i}`;
      if (node.type === 'text') return node.text;
      switch (node.tag) {
        case 'br':
          return '\n';
        case 'strong':
          return (
            <Text key={key} style={[styles.strong, { color: colors.strong }]}>
              {inline(node.children, key)}
            </Text>
          );
        case 'em':
          return (
            <Text key={key} style={styles.em}>
              {inline(node.children, key)}
            </Text>
          );
        case 'a':
          return (
            <Text
              key={key}
              style={[styles.link, { color: colors.link }]}
              accessibilityRole="link"
              onPress={node.href ? () => void WebBrowser.openBrowserAsync(node.href as string) : undefined}
            >
              {inline(node.children, key)}
            </Text>
          );
        default:
          return <Fragment key={key}>{inline(node.children, key)}</Fragment>;
      }
    });

  const block = (node: HtmlNode, key: string, base: TextStyle): ReactNode => {
    if (node.type === 'text') {
      return node.text.trim() ? (
        <Text key={key} style={[base, styles.paragraph, { color: colors.text }]}>
          {node.text}
        </Text>
      ) : null;
    }

    switch (node.tag) {
      case 'h2':
      case 'h3':
        return (
          <Text
            key={key}
            style={[
              node.tag === 'h2' ? typography.heading : typography.subheading,
              styles.heading,
              { color: colors.strong },
            ]}
            accessibilityRole="header"
          >
            {inline(node.children, key)}
          </Text>
        );
      case 'ul':
      case 'ol': {
        const items = node.children.filter(
          (c): c is Extract<HtmlNode, { type: 'element' }> => c.type === 'element' && c.tag === 'li',
        );
        return (
          <View key={key} style={styles.list}>
            {items.map((li, i) => (
              <View key={`${key}-${i}`} style={styles.listItem}>
                <Text style={[base, styles.marker, { color: colors.link }]}>
                  {node.tag === 'ol' ? `${i + 1}.` : '•'}
                </Text>
                <Text style={[base, styles.flex, { color: colors.text }]}>{inline(li.children, `${key}-${i}`)}</Text>
              </View>
            ))}
          </View>
        );
      }
      case 'blockquote':
        return (
          <View key={key} style={[styles.quote, { borderLeftColor: colors.quote, backgroundColor: colors.quoteBg }]}>
            <Text style={[base, styles.quoteText, { color: colors.strong }]}>{inline(node.children, key)}</Text>
          </View>
        );
      default:
        return (
          <Text key={key} style={[base, styles.paragraph, { color: colors.text }]}>
            {inline([node], key)}
          </Text>
        );
    }
  };

  return <View>{nodes.map((node, i) => block(node, `b${i}`, typography.body))}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  paragraph: { marginBottom: spacing.md, lineHeight: 24 },
  strong: { fontFamily: fonts.semibold },
  em: { fontStyle: 'italic' },
  link: { textDecorationLine: 'underline', fontFamily: fonts.medium },
  heading: { marginTop: spacing.md, marginBottom: spacing.sm },
  list: { marginBottom: spacing.md, gap: 6 },
  listItem: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.sm },
  marker: { width: 18, textAlign: 'right', fontFamily: fonts.bold },
  quote: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  quoteText: { fontStyle: 'italic', lineHeight: 23 },
});
