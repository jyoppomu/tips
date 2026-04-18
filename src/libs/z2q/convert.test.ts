import { describe, it, expect } from "vitest";
import {
  RAW_BASE_URL,
  convertAlertNote,
  convertBody,
  convertFootnotes,
  convertImagePath,
  convertInfoNote,
  extractSyncedQiitaArticleId,
  removeSyncedQiitaArticleIdComments,
  stampSyncedZennArticleIdInBody,
} from "./convert.ts";

describe("convertInfoNote", () => {
  it("converts a bare ':::message' line to ':::note info'", () => {
    expect(convertInfoNote(":::message")).toBe(":::note info");
  });

  it("does not touch ':::message alert'", () => {
    expect(convertInfoNote(":::message alert")).toBe(":::message alert");
  });

  it("does not match when the line is not exactly ':::message'", () => {
    expect(convertInfoNote("Some :::message in the middle")).toBe(
      "Some :::message in the middle",
    );
    expect(convertInfoNote(":::messagex")).toBe(":::messagex");
  });

  it("leaves unrelated lines unchanged", () => {
    expect(convertInfoNote("普通の本文")).toBe("普通の本文");
    expect(convertInfoNote("")).toBe("");
  });
});

describe("convertAlertNote", () => {
  it("converts a bare ':::message alert' line to ':::note alert'", () => {
    expect(convertAlertNote(":::message alert")).toBe(":::note alert");
  });

  it("does not touch plain ':::message'", () => {
    expect(convertAlertNote(":::message")).toBe(":::message");
  });

  it("leaves unrelated lines unchanged", () => {
    expect(convertAlertNote("普通の本文")).toBe("普通の本文");
  });
});

describe("convertImagePath", () => {
  const articleId = "abc123";

  it("rewrites a local image path with width spec to raw.githubusercontent URL", () => {
    expect(
      convertImagePath("![cap](/images/abc123/foo.png =320x)", articleId),
    ).toBe(
      `<img src="${RAW_BASE_URL}/images/abc123/foo.png" alt="cap" width="320">`,
    );
  });

  it("rewrites a local image path without width spec", () => {
    expect(convertImagePath("![cap](/images/abc123/foo.png)", articleId)).toBe(
      `<img src="${RAW_BASE_URL}/images/abc123/foo.png" alt="cap">`,
    );
  });

  it("rewrites an external URL image with width spec", () => {
    expect(
      convertImagePath("![alt](https://example.com/img.png =100x)", articleId),
    ).toBe('<img src="https://example.com/img.png" alt="alt" width="100">');
  });

  it("rewrites an external URL image without width spec", () => {
    expect(
      convertImagePath("![alt](https://example.com/img.png)", articleId),
    ).toBe('<img src="https://example.com/img.png" alt="alt">');
  });

  it("does not rewrite a non-image line", () => {
    expect(convertImagePath("just text", articleId)).toBe("just text");
    expect(convertImagePath("[link](https://x.com)", articleId)).toBe(
      "[link](https://x.com)",
    );
  });

  it("treats a different article's /images/ path as an external URL (not rewritten to raw)", () => {
    // ローカルパターンは /images/{articleId}/ にマッチしないので外部URL扱いで img タグ化
    expect(convertImagePath("![alt](/images/OTHER/img.png)", articleId)).toBe(
      '<img src="/images/OTHER/img.png" alt="alt">',
    );
  });
});

describe("removeSyncedQiitaArticleIdComments", () => {
  it("removes a comment line (including its trailing \\n)", () => {
    expect(
      removeSyncedQiitaArticleIdComments(
        "foo\n<!-- qiita article id: abc -->\nbar\n",
      ),
    ).toBe("foo\nbar\n");
  });

  it("removes multiple occurrences", () => {
    expect(
      removeSyncedQiitaArticleIdComments(
        "<!-- qiita article id: 1 -->\n<!-- qiita article id: 2 -->\nx\n",
      ),
    ).toBe("x\n");
  });

  it("does not remove a comment that lacks trailing \\n (Python-compat)", () => {
    // Python 版は regex が `\n` を要求するため末尾 \n なしだとマッチしない
    expect(
      removeSyncedQiitaArticleIdComments(
        "foo\n<!-- qiita article id: abc -->",
      ),
    ).toBe("foo\n<!-- qiita article id: abc -->");
  });

  it("leaves non-matching content alone", () => {
    expect(removeSyncedQiitaArticleIdComments("hello\nworld\n")).toBe(
      "hello\nworld\n",
    );
  });
});

describe("extractSyncedQiitaArticleId", () => {
  it("returns the id when the comment exists", () => {
    expect(
      extractSyncedQiitaArticleId(
        "foo\n<!-- qiita article id: abc123 -->\nbar\n",
      ),
    ).toBe("abc123");
  });

  it("returns null when no comment exists", () => {
    expect(extractSyncedQiitaArticleId("foo\nbar\n")).toBe(null);
  });

  it("returns the first id when multiple occurrences exist", () => {
    expect(
      extractSyncedQiitaArticleId(
        "<!-- qiita article id: first -->\n<!-- qiita article id: second -->\n",
      ),
    ).toBe("first");
  });

  it("matches even without a trailing \\n (re.search semantics)", () => {
    expect(
      extractSyncedQiitaArticleId("<!-- qiita article id: tail -->"),
    ).toBe("tail");
  });
});

describe("stampSyncedZennArticleIdInBody", () => {
  it("appends a blank line + comment + trailing \\n when body ends with \\n", () => {
    expect(stampSyncedZennArticleIdInBody("last content\n", "zennId")).toBe(
      "last content\n\n<!-- zenn article id: zennId -->\n",
    );
  });

  it("does not insert a blank line when body does not end with \\n", () => {
    expect(stampSyncedZennArticleIdInBody("last content", "zennId")).toBe(
      "last content\n<!-- zenn article id: zennId -->\n",
    );
  });
});

describe("convertBody", () => {
  it("applies per-line + body-level transformations in Python order", () => {
    const zennBody = [
      "",
      "# Title",
      "",
      ":::message",
      "info content",
      ":::",
      "",
      ":::message alert",
      "alert content",
      ":::",
      "",
      "![local](/images/abc123/img.png =500x)",
      "![external](https://example.com/pic.png)",
      "",
      "body text with^[this is a note] more.",
      "",
      "<!-- qiita article id: oldQiitaId -->",
      "",
    ].join("\n");

    const result = convertBody(zennBody, "abc123");

    // note 系が変換される
    expect(result).toContain(":::note info");
    expect(result).toContain(":::note alert");
    expect(result).not.toContain(":::message");
    // ローカル画像は raw URL に書き換え
    expect(result).toContain(
      `<img src="${RAW_BASE_URL}/images/abc123/img.png" alt="local" width="500">`,
    );
    // 外部画像はそのまま <img> 化
    expect(result).toContain(
      '<img src="https://example.com/pic.png" alt="external">',
    );
    // 既存の qiita-id コメントは削除
    expect(result).not.toContain("qiita article id: oldQiitaId");
    // Zenn-id スタンプが追加される
    expect(result).toContain("<!-- zenn article id: abc123 -->");
    // footnote: 本文側は [^1] 参照、末尾に定義
    expect(result).toContain("[^1]");
    expect(result).toContain("[^1]: this is a note");
  });

  it("returns a body ending with \\n so that serializedFm + body builds a valid file", () => {
    const zennBody = "\n# h1\nhello\n";
    const result = convertBody(zennBody, "articleId");
    expect(result.endsWith("\n")).toBe(true);
  });
});

describe("convertFootnotes", () => {
  it("returns body unchanged when no footnotes present", () => {
    expect(convertFootnotes("hello\nworld\n")).toBe("hello\nworld\n");
  });

  it("converts a single ^[...] to [^1] and appends its definition", () => {
    expect(convertFootnotes("see^[this is a note] ref\n")).toBe(
      "see[^1] ref\n\n[^1]: this is a note\n",
    );
  });

  it("numbers multiple footnotes in appearance order across lines", () => {
    expect(convertFootnotes("line1 ^[note a] more\nline2 ^[note b]\n")).toBe(
      "line1 [^1] more\nline2 [^2]\n\n[^1]: note a\n[^2]: note b\n",
    );
  });

  it("preserves Python greedy-match behavior on a line with multiple ^[...]", () => {
    // 同一行に複数 `^[...]` があると greedy `.*` が最外までマッチする。
    // 結果として content は `a]^[b`（Python 実装と同じ挙動）。
    expect(convertFootnotes("x ^[a]^[b] y\n")).toBe(
      "x [^1] y\n\n[^1]: a]^[b\n",
    );
  });
});
