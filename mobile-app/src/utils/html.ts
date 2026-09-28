/**
 * Parser for the small HTML subset the API allows in news and policy bodies:
 * p, br, strong, em, ul, ol, li, a (href), h2, h3, blockquote. Anything else is
 * dropped but its text is kept, so unexpected markup can never break the screen.
 */

export const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'blockquote'] as const;
export type AllowedTag = (typeof ALLOWED_TAGS)[number];

export type HtmlNode =
  { type: 'text'; text: string } | { type: 'element'; tag: AllowedTag; href?: string; children: HtmlNode[] };

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  '#39': "'",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const value = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(value) ? String.fromCodePoint(value) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

const isAllowed = (tag: string): tag is AllowedTag => (ALLOWED_TAGS as readonly string[]).includes(tag);

export function parseHtml(html: string): HtmlNode[] {
  const root: HtmlNode[] = [];
  const stack: { tag: AllowedTag; node: Extract<HtmlNode, { type: 'element' }> }[] = [];
  const children = () => (stack.length ? stack[stack.length - 1].node.children : root);

  const tokens = html.split(/(<[^>]+>)/g);
  for (const token of tokens) {
    if (!token) continue;

    const tagMatch = token.match(/^<\s*(\/)?\s*([a-z0-9]+)([^>]*)>$/i);
    if (!tagMatch) {
      const text = decodeEntities(token);
      if (text) children().push({ type: 'text', text });
      continue;
    }

    const [, closing, rawName, attributes] = tagMatch;
    const tag = rawName.toLowerCase();
    if (!isAllowed(tag)) continue;

    if (tag === 'br') {
      children().push({ type: 'element', tag: 'br', children: [] });
      continue;
    }

    if (closing) {
      const index = stack.map((s) => s.tag).lastIndexOf(tag);
      if (index !== -1) stack.length = index;
      continue;
    }

    const node: Extract<HtmlNode, { type: 'element' }> = { type: 'element', tag, children: [] };
    if (tag === 'a') {
      const href = attributes.match(/href\s*=\s*"([^"]*)"|href\s*=\s*'([^']*)'/i);
      const value = href ? decodeEntities(href[1] ?? href[2] ?? '') : '';
      if (/^(https?:|mailto:)/i.test(value)) node.href = value;
    }
    children().push(node);
    stack.push({ tag, node });
  }

  return root;
}

/** Plain text of a body, e.g. for previews and accessibility labels. */
export function htmlToText(html: string): string {
  const walk = (nodes: HtmlNode[]): string =>
    nodes.map((n) => (n.type === 'text' ? n.text : n.tag === 'br' ? '\n' : walk(n.children))).join('');
  return walk(parseHtml(html)).replace(/\s+/g, ' ').trim();
}
