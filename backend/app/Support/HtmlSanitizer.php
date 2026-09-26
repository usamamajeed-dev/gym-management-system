<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Cleans rich-text bodies from the admin editor down to a small, safe subset:
 * p, br, strong, em, ul, ol, li, a, h2, h3, blockquote.
 *
 * Every allowed tag is rebuilt without attributes, except links, which keep
 * only an http(s), mailto or relative href. That removes on* handlers, inline
 * styles and javascript:/data: URLs. Plain text passes through unchanged.
 */
final class HtmlSanitizer
{
    public const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'h2', 'h3', 'blockquote'];

    public static function clean(string $html): string
    {
        // Drop script/style blocks with their content, not just the tags.
        $html = (string) preg_replace('#<(script|style|iframe|object|embed)\b[^>]*>.*?</\1\s*>#is', '', $html);

        $html = strip_tags($html, '<'.implode('><', self::ALLOWED_TAGS).'>');

        return (string) preg_replace_callback(
            '#<(/?)([a-z0-9]+)\b([^>]*)>#i',
            fn (array $m): string => self::rebuildTag($m[1] === '/', strtolower($m[2]), $m[3]),
            $html,
        );
    }

    private static function rebuildTag(bool $closing, string $tag, string $attributes): string
    {
        if (! in_array($tag, self::ALLOWED_TAGS, true)) {
            return '';
        }

        if ($closing) {
            return $tag === 'br' ? '' : "</{$tag}>";
        }

        if ($tag === 'a') {
            $href = self::safeHref($attributes);

            return $href === null ? '<a>' : '<a href="'.htmlspecialchars($href, ENT_QUOTES).'">';
        }

        return $tag === 'br' ? '<br>' : "<{$tag}>";
    }

    /** The href value when it's http(s), mailto or relative; null otherwise. */
    private static function safeHref(string $attributes): ?string
    {
        if (preg_match('#\bhref\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+))#i', $attributes, $m) !== 1) {
            return null;
        }

        $href = trim(html_entity_decode($m[1] !== '' ? $m[1] : ($m[2] ?? '').($m[3] ?? ''), ENT_QUOTES | ENT_HTML5));
        $normalised = strtolower((string) preg_replace('/[\s\x00-\x1F]+/', '', $href));

        if (preg_match('#^(https?:|mailto:|/|\#)#', $normalised) === 1 || ! str_contains($normalised, ':')) {
            return $href;
        }

        return null;
    }
}
