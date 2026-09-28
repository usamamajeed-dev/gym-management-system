import { decodeEntities, htmlToText, parseHtml } from './html';

describe('parseHtml', () => {
  it('builds a tree of the allowed tags', () => {
    const nodes = parseHtml('<p>Hi <strong>there</strong></p><ul><li>One</li><li>Two</li></ul>');

    expect(nodes).toEqual([
      {
        type: 'element',
        tag: 'p',
        children: [
          { type: 'text', text: 'Hi ' },
          { type: 'element', tag: 'strong', children: [{ type: 'text', text: 'there' }] },
        ],
      },
      {
        type: 'element',
        tag: 'ul',
        children: [
          { type: 'element', tag: 'li', children: [{ type: 'text', text: 'One' }] },
          { type: 'element', tag: 'li', children: [{ type: 'text', text: 'Two' }] },
        ],
      },
    ]);
  });

  it('drops unknown tags but keeps their text', () => {
    expect(htmlToText('<div><span>Kept</span> text</div>')).toBe('Kept text');
  });

  it('keeps only http(s) and mailto links', () => {
    const [safe, unsafe] = parseHtml('<a href="https://gym.test/rules">Rules</a><a href="javascript:alert(1)">Bad</a>');

    expect(safe).toMatchObject({ tag: 'a', href: 'https://gym.test/rules' });
    expect(unsafe).toMatchObject({ tag: 'a' });
    expect((unsafe as { href?: string }).href).toBeUndefined();
  });

  it('decodes entities', () => {
    expect(decodeEntities('Fish &amp; chips &lt;3 &#39;yum&#39; &nbsp;ok')).toBe("Fish & chips <3 'yum'  ok");
  });
});
