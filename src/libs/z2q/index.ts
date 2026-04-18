import { convertBody } from "./convert.ts";
import {
  initialQiitaFrontMatter,
  mergeZennIntoQiitaFrontMatter,
  serializeQiitaFrontMatter,
} from "./frontMatter.ts";
import {
  createQiitaArticle,
  qiitaArticlePath,
  readQiitaArticle,
  readZennArticle,
  stampSyncedQiitaArticleIdInZennFile,
  writeArticle,
} from "./io.ts";
import { extractSyncedQiitaArticleId } from "./convert.ts";

export type ZennToQiitaOptions = {
  articleId: string;
};

// Python `ZennToQiita.convert()` 相当のメインフロー。
//   1. Zenn 記事を読み込み
//   2. 本文内の `<!-- qiita article id: ... -->` から既存 Qiita ID を探す
//      - なければ Qiita CLI で新規作成し、取得した ID を Zenn 側にスタンプ
//      - あれば既存の Qiita 記事を読み込み
//   3. front matter を Zenn 側の内容でマージ、body を変換
//   4. Qiita 記事ファイルに書き出し
export async function z2q({ articleId }: ZennToQiitaOptions): Promise<void> {
  console.info("Convert Zenn to Qiita");

  const { frontMatter: zennFm, body: zennBody } = readZennArticle(articleId);
  console.info(`Zenn article: ${articleId}`);

  const syncedQiitaId = extractSyncedQiitaArticleId(zennBody);
  const convertedBody = convertBody(zennBody, articleId);

  const qiitaId =
    syncedQiitaId ??
    (() => {
      const initialFm = initialQiitaFrontMatter(zennFm);
      const newId = createQiitaArticle(
        articleId,
        serializeQiitaFrontMatter(initialFm),
        convertedBody,
      );
      stampSyncedQiitaArticleIdInZennFile(articleId, newId);
      return newId;
    })();

  const { frontMatter: existingQiitaFm } = readQiitaArticle(qiitaId);
  console.info(`Qiita article: ${qiitaId}`);

  const mergedFm = mergeZennIntoQiitaFrontMatter(existingQiitaFm, zennFm);
  writeArticle(
    qiitaArticlePath(qiitaId),
    serializeQiitaFrontMatter(mergedFm),
    convertedBody,
  );
}
