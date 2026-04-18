import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { repositoryRoot } from "./config.ts";
import {
  initialQiitaFrontMatter,
  mergeZennIntoQiitaFrontMatter,
  parseQiitaFrontMatter,
  parseZennFrontMatter,
  serializeQiitaFrontMatter,
  splitFrontMatter,
} from "./frontMatter.ts";

describe("splitFrontMatter", () => {
  it("separates front matter from body, keeping the leading newline in body", () => {
    const content = "---\ntitle: x\n---\n\n## h1\n";
    const { frontMatterText, body } = splitFrontMatter(content);
    expect(frontMatterText).toBe("title: x");
    expect(body).toBe("\n## h1\n");
  });

  it("throws if no front matter block is found", () => {
    expect(() => splitFrontMatter("no front matter here")).toThrow(
      /front matter not found/,
    );
  });
});

describe("parseZennFrontMatter", () => {
  it("parses double-quoted strings, flow array, and trailing comments", () => {
    const content = [
      "---",
      'title: "Appium環境構築（Android編）"',
      'emoji: "📱"',
      'type: "tech" # tech: 技術記事 / idea: アイデア',
      'topics: ["Appium", "Android", "test"]',
      "published: true",
      "---",
      "",
      "## はじめに",
      "",
    ].join("\n");
    const { frontMatter, body } = parseZennFrontMatter(content);
    expect(frontMatter).toEqual({
      title: "Appium環境構築（Android編）",
      emoji: "📱",
      type: "tech",
      topics: ["Appium", "Android", "test"],
      published: true,
    });
    expect(body).toBe("\n## はじめに\n");
  });
});

describe("parseQiitaFrontMatter", () => {
  it("parses bare null and single-quoted date", () => {
    const content = [
      "---",
      "title: PlaywrightでのWebプッシュ通知の取り扱い",
      "tags:",
      "  - テスト",
      "  - Web",
      "private: false",
      "updated_at: '2025-03-25T12:09:04+09:00'",
      "id: 08cef803306cdad7791c",
      "organization_url_name: null",
      "slide: false",
      "ignorePublish: false",
      "---",
      "## はじめに",
      "",
    ].join("\n");
    const { frontMatter } = parseQiitaFrontMatter(content);
    expect(frontMatter).toEqual({
      title: "PlaywrightでのWebプッシュ通知の取り扱い",
      tags: ["テスト", "Web"],
      private: false,
      updated_at: "2025-03-25T12:09:04+09:00",
      id: "08cef803306cdad7791c",
      organization_url_name: null,
      slide: false,
      ignorePublish: false,
    });
  });
});

describe("serializeQiitaFrontMatter", () => {
  it("produces the Python-compatible exact format", () => {
    const serialized = serializeQiitaFrontMatter({
      title: "タイトル",
      tags: ["a", "b"],
      private: false,
      updated_at: "2025-03-25T12:09:04+09:00",
      id: "abc123",
      organization_url_name: null,
      slide: false,
      ignorePublish: false,
    });
    expect(serialized).toBe(
      [
        "---",
        "title: タイトル",
        "tags:",
        "  - a",
        "  - b",
        "private: false",
        "updated_at: '2025-03-25T12:09:04+09:00'",
        "id: abc123",
        "organization_url_name: null",
        "slide: false",
        "ignorePublish: false",
        "---",
      ].join("\n"),
    );
  });

  it("emits empty tags block when no tags", () => {
    const serialized = serializeQiitaFrontMatter({
      title: "x",
      tags: [],
      private: true,
      updated_at: "",
      id: "null",
      organization_url_name: null,
      slide: false,
      ignorePublish: false,
    });
    // tags: の次に items が無い
    expect(serialized).toContain("tags:\nprivate:");
  });
});

describe("schema validation", () => {
  it("rejects Zenn front matter with missing required field", () => {
    const content = [
      "---",
      'title: "t"',
      'emoji: "x"',
      'type: "tech"',
      'topics: ["a"]',
      // published 欠落
      "---",
      "",
      "body",
    ].join("\n");
    expect(() => parseZennFrontMatter(content)).toThrow();
  });

  it("rejects Zenn type that is not 'tech' or 'idea'", () => {
    const content = [
      "---",
      'title: "t"',
      'emoji: "x"',
      'type: "blog"',
      'topics: ["a"]',
      "published: true",
      "---",
      "",
      "body",
    ].join("\n");
    expect(() => parseZennFrontMatter(content)).toThrow();
  });

  it("rejects Qiita front matter with wrong type for `private`", () => {
    const content = [
      "---",
      "title: x",
      "tags:",
      "  - a",
      'private: "no"', // string なので boolean 期待と違う
      "updated_at: '2025-01-01T00:00:00+09:00'",
      "id: abc",
      "organization_url_name: null",
      "slide: false",
      "ignorePublish: false",
      "---",
    ].join("\n");
    expect(() => parseQiitaFrontMatter(content)).toThrow();
  });
});

describe("initialQiitaFrontMatter", () => {
  it("builds a Qiita FM from Zenn FM with placeholder id/updated_at", () => {
    expect(
      initialQiitaFrontMatter({
        title: "T",
        emoji: "🧪",
        type: "tech",
        topics: ["a", "b"],
        published: true,
      }),
    ).toEqual({
      title: "T",
      tags: ["a", "b"],
      private: true,
      updated_at: "",
      id: "null",
      organization_url_name: null,
      slide: false,
      ignorePublish: false,
    });
  });
});

describe("mergeZennIntoQiitaFrontMatter", () => {
  it("overwrites only title/tags/private while preserving id, updated_at, organization_url_name, slide, ignorePublish", () => {
    const existing = {
      title: "OLD",
      tags: ["old-tag"],
      private: true,
      updated_at: "2025-01-01T00:00:00+09:00",
      id: "qiitaId-preserved",
      organization_url_name: "acme",
      slide: true,
      ignorePublish: true,
    };
    const zenn = {
      title: "NEW",
      emoji: "🧪",
      type: "tech" as const,
      topics: ["new-tag1", "new-tag2"],
      published: true,
    };
    expect(mergeZennIntoQiitaFrontMatter(existing, zenn)).toEqual({
      title: "NEW",
      tags: ["new-tag1", "new-tag2"],
      private: false,
      updated_at: "2025-01-01T00:00:00+09:00",
      id: "qiitaId-preserved",
      organization_url_name: "acme",
      slide: true,
      ignorePublish: true,
    });
  });

  it("sets private=true when published=false", () => {
    const existing: ReturnType<typeof initialQiitaFrontMatter> = {
      title: "",
      tags: [],
      private: false,
      updated_at: "",
      id: "",
      organization_url_name: null,
      slide: false,
      ignorePublish: false,
    };
    const merged = mergeZennIntoQiitaFrontMatter(existing, {
      title: "t",
      emoji: "",
      type: "idea",
      topics: [],
      published: false,
    });
    expect(merged.private).toBe(true);
  });
});

describe("Qiita front matter roundtrip (real file)", () => {
  it("re-serializing a parsed real public/*.md yields identical FM block", () => {
    const filePath = path.join(
      repositoryRoot,
      "public",
      "08cef803306cdad7791c.md",
    );
    const content = readFileSync(filePath, "utf8");
    const { frontMatter } = parseQiitaFrontMatter(content);
    const serialized = serializeQiitaFrontMatter(frontMatter);
    const originalFmBlock =
      content.match(/^---\r?\n[\s\S]*?\r?\n---/)?.[0] ?? "";
    expect(serialized).toBe(originalFmBlock);
  });
});
