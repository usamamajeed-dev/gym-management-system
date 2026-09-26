<?php

declare(strict_types=1);

namespace Tests\Unit\Support;

use App\Support\HtmlSanitizer;
use PHPUnit\Framework\TestCase;

class HtmlSanitizerTest extends TestCase
{
    public function test_plain_text_is_unchanged(): void
    {
        $this->assertSame('Gym closes early on Friday.', HtmlSanitizer::clean('Gym closes early on Friday.'));
    }

    public function test_allowed_tags_are_kept(): void
    {
        $html = '<h2>Title</h2><p>Hello <strong>bold</strong> <em>it</em><br></p><ul><li>a</li></ul><ol><li>b</li></ol><blockquote>q</blockquote><h3>Sub</h3>';

        $this->assertSame($html, HtmlSanitizer::clean($html));
    }

    public function test_script_and_style_blocks_are_removed_with_their_content(): void
    {
        $this->assertSame('<p>Hi</p>', HtmlSanitizer::clean('<p>Hi</p><script>alert(1)</script><style>p{}</style>'));
    }

    public function test_disallowed_tags_are_stripped_but_text_kept(): void
    {
        $this->assertSame('<p>Hello world</p>', HtmlSanitizer::clean('<div><p>Hello <span>world</span></p></div><img src="x.png">'));
    }

    public function test_event_handler_and_style_attributes_are_removed(): void
    {
        $this->assertSame(
            '<p>Hi</p>',
            HtmlSanitizer::clean('<p onclick="steal()" style="color:red" ONMOUSEOVER=\'x()\'>Hi</p>'),
        );
    }

    public function test_javascript_and_data_links_lose_their_href(): void
    {
        $this->assertSame('<a>x</a>', HtmlSanitizer::clean('<a href="javascript:alert(1)">x</a>'));
        $this->assertSame('<a>x</a>', HtmlSanitizer::clean('<a href=" JaVaScRiPt:alert(1)">x</a>'));
        $this->assertSame('<a>x</a>', HtmlSanitizer::clean('<a href="java&#115;cript:alert(1)">x</a>'));
        $this->assertSame('<a>x</a>', HtmlSanitizer::clean('<a href="data:text/html;base64,xx">x</a>'));
    }

    public function test_safe_links_keep_only_the_href(): void
    {
        $this->assertSame(
            '<a href="https://gym.test/rules">rules</a>',
            HtmlSanitizer::clean('<a href="https://gym.test/rules" onclick="x()" target="_blank">rules</a>'),
        );
        $this->assertSame('<a href="mailto:desk@gym.test">m</a>', HtmlSanitizer::clean("<a href='mailto:desk@gym.test'>m</a>"));
        $this->assertSame('<a href="/policies">p</a>', HtmlSanitizer::clean('<a href=/policies>p</a>'));
    }
}
