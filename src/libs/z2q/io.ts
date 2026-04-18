import {
  appendFileSync,
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import {
  nodeModulesDirectory,
  qiitaArticleDirectory,
  repositoryRoot,
  zennArticleDirectory,
} from "./config.ts";
import {
  parseQiitaFrontMatter,
  parseZennFrontMatter,
  type QiitaFrontMatter,
  type ZennFrontMatter,
} from "./frontMatter.ts";

export function zennArticlePath(articleId: string): string {
  return path.join(zennArticleDirectory, `${articleId}.md`);
}

export function qiitaArticlePath(articleId: string): string {
  return path.join(qiitaArticleDirectory, `${articleId}.md`);
}

export function readZennArticle(articleId: string): {
  frontMatter: ZennFrontMatter;
  body: string;
} {
  const p = zennArticlePath(articleId);
  if (!existsSync(p)) {
    throw new Error(`Zenn article not found: ${p}`);
  }
  return parseZennFrontMatter(readFileSync(p, "utf8"));
}

export function readQiitaArticle(articleId: string): {
  frontMatter: QiitaFrontMatter;
  body: string;
} {
  const p = qiitaArticlePath(articleId);
  if (!existsSync(p)) {
    throw new Error(`Qiita article not found: ${p}`);
  }
  return parseQiitaFrontMatter(readFileSync(p, "utf8"));
}

// front matter 文字列 + body を UTF-8 で書き出す。
// serializeQiitaFrontMatter は末尾 \n なし、body は先頭 \n ありの想定（splitFrontMatter の仕様）。
export function writeArticle(
  filePath: string,
  frontMatterString: string,
  body: string,
): void {
  writeFileSync(filePath, `${frontMatterString}${body}`, "utf8");
}

// Python `_stamp_synced_qiita_article_id` 相当。Zenn 記事ファイルの末尾に追記する。
export function stampSyncedQiitaArticleIdInZennFile(
  zennArticleId: string,
  qiitaArticleId: string,
): void {
  appendFileSync(
    zennArticlePath(zennArticleId),
    `\n<!-- qiita article id: ${qiitaArticleId} -->\n`,
    "utf8",
  );
}

// Python `_create_qiita_article` 相当。
// 1. tentative な front matter + body を `public/<zennArticleId>.md` に書く
// 2. `node_modules/.bin/qiita publish <zennArticleId> --root <repo>` を起動
// 3. Qiita CLI が front matter に id / updated_at を埋めたものを再読込し、id を取得
// 4. ファイルを `public/<qiitaId>.md` にリネーム
// 戻り値: 生成された qiita article id
export function createQiitaArticle(
  zennArticleId: string,
  initialFrontMatterString: string,
  body: string,
): string {
  const tentativePath = qiitaArticlePath(zennArticleId);
  writeArticle(tentativePath, initialFrontMatterString, body);

  const qiitaCliPath = path.join(nodeModulesDirectory, ".bin", "qiita");
  const result = spawnSync(
    qiitaCliPath,
    ["publish", zennArticleId, "--root", repositoryRoot],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(
      `qiita publish failed (exit=${result.status}): ${result.stderr}`,
    );
  }

  const { frontMatter } = parseQiitaFrontMatter(
    readFileSync(tentativePath, "utf8"),
  );
  const qiitaId = frontMatter.id;
  renameSync(tentativePath, qiitaArticlePath(qiitaId));
  return qiitaId;
}
