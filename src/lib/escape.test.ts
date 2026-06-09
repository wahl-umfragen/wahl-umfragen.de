import { describe, expect, it } from "vitest";
import { escapeHtml, escapeXml } from "./escape";

describe("escapeXml", () => {
  it("escapes the five XML entities", () => {
    expect(escapeXml(`a & b < c > d " e ' f`)).toBe(
      "a &amp; b &lt; c &gt; d &quot; e &apos; f",
    );
  });

  it("neutralises an injection attempt in a feed title", () => {
    expect(escapeXml("</title><script>alert(1)</script>")).toBe(
      "&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });

  it("escapes ampersands before other entities (no double-escaping artefacts)", () => {
    expect(escapeXml("Tom & Jerry < 5")).toBe("Tom &amp; Jerry &lt; 5");
  });
});

describe("escapeHtml", () => {
  it("escapes &, <, >, \" but not apostrophes", () => {
    expect(escapeHtml(`x & y < z > w "q"`)).toBe(
      'x &amp; y &lt; z &gt; w &quot;q&quot;',
    );
  });

  it("neutralises a script tag in embed content", () => {
    expect(escapeHtml("<img src=x onerror=alert(1)>")).toBe(
      "&lt;img src=x onerror=alert(1)&gt;",
    );
  });
});
