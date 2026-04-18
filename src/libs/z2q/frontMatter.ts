import { parse as yamlParse } from "yaml";
import { z } from "zod";

export const FM_SEPARATOR = "---";

export const ZennFrontMatterSchema = z.object({
  title: z.string(),
  emoji: z.string(),
  type: z.enum(["tech", "idea"]),
  topics: z.array(z.string()),
  published: z.boolean(),
});
export type ZennFrontMatter = z.infer<typeof ZennFrontMatterSchema>;

export const QiitaFrontMatterSchema = z.object({
  title: z.string(),
  tags: z.array(z.string()),
  private: z.boolean(),
  updated_at: z.string(),
  id: z.string(),
  organization_url_name: z.string().nullable(),
  slide: z.boolean(),
  ignorePublish: z.boolean(),
});
export type QiitaFrontMatter = z.infer<typeof QiitaFrontMatterSchema>;

// 先頭 `---`〜次の `---` を front matter として抽出し、残りを本文として返す。
// 本文側の先頭改行（`---\n` の直後の `\n`）は body に含めたままにする（Python 実装と互換）。
export function splitFrontMatter(content: string): {
  frontMatterText: string;
  body: string;
} {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    throw new Error("front matter not found");
  }
  return {
    frontMatterText: match[1] ?? "",
    body: content.slice(match[0].length),
  };
}

export function parseZennFrontMatter(content: string): {
  frontMatter: ZennFrontMatter;
  body: string;
} {
  const { frontMatterText, body } = splitFrontMatter(content);
  const frontMatter = ZennFrontMatterSchema.parse(yamlParse(frontMatterText));
  return { frontMatter, body };
}

export function parseQiitaFrontMatter(content: string): {
  frontMatter: QiitaFrontMatter;
  body: string;
} {
  const { frontMatterText, body } = splitFrontMatter(content);
  const frontMatter = QiitaFrontMatterSchema.parse(yamlParse(frontMatterText));
  return { frontMatter, body };
}

// Python `_create_qiita_article` 冒頭の QiitaFrontMatter(title="", tags=[], private=True)
// 相当の初期 FM を組み立てる（id などは Qiita CLI が後で埋めるプレースホルダ）。
export function initialQiitaFrontMatter(
  zennFrontMatter: ZennFrontMatter,
): QiitaFrontMatter {
  return {
    title: zennFrontMatter.title,
    tags: zennFrontMatter.topics,
    private: true,
    updated_at: "",
    id: "null",
    organization_url_name: null,
    slide: false,
    ignorePublish: false,
  };
}

// Python `_convert_front_matter` 相当。既存 Qiita FM の id/updated_at/organization_url_name
// 等は保ったまま、Zenn 側の title/topics/published を上書きする。
export function mergeZennIntoQiitaFrontMatter(
  existingQiitaFrontMatter: QiitaFrontMatter,
  zennFrontMatter: ZennFrontMatter,
): QiitaFrontMatter {
  return {
    ...existingQiitaFrontMatter,
    title: zennFrontMatter.title,
    tags: zennFrontMatter.topics,
    private: !zennFrontMatter.published,
  };
}

// Python `QiitaFrontMatter.create_string()` と完全互換の出力を作る。
// キー順・空配列時の書式・updated_at のシングルクォート・null の bare 表記を固定する。
export function serializeQiitaFrontMatter(fm: QiitaFrontMatter): string {
  return [
    FM_SEPARATOR,
    `title: ${fm.title}`,
    "tags:",
    ...fm.tags.map((tag) => `  - ${tag}`),
    `private: ${fm.private}`,
    `updated_at: '${fm.updated_at}'`,
    `id: ${fm.id}`,
    `organization_url_name: ${fm.organization_url_name ?? "null"}`,
    `slide: ${fm.slide}`,
    `ignorePublish: ${fm.ignorePublish}`,
    FM_SEPARATOR,
  ].join("\n");
}
