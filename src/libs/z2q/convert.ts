// 変換ヘルパ群。いずれも「行末 \n を含まない 1 行」を入出力の単位とする。
// 元の Python 実装は readlines() の行（\n 込み）を扱っていたが、TS 側は split("\n") で
// \n を落とした前提に統一し、出力時に join("\n") で戻す。

// 画像のローカルパスを書き換える際の raw.githubusercontent URL のベース。
// 元実装ではハードコードされていたためそのまま踏襲する。
export const RAW_BASE_URL =
  "https://raw.githubusercontent.com/jyoppomu/tips/main";

export function convertInfoNote(line: string): string {
  return line.replace(/^:::message$/, ":::note info");
}

// Python `_remove_synced_qiita_article_id` 相当。
// Python 版の regex は末尾 \n を要求するため、\n 付きで書かれた同期マーカー行を
// 行ごと（\n 込みで）削除する意味論。TS 側も body 全体を 1 つの文字列として扱い、
// 同じマッチング条件で置換する。
export function removeSyncedQiitaArticleIdComments(body: string): string {
  return body.replace(/<!-- qiita article id: .* -->\n/g, "");
}

// Python `_get_synced_qiita_article_id` 相当。`re.search` と同じく部分一致で探す。
export function extractSyncedQiitaArticleId(body: string): string | null {
  const m = body.match(/<!-- qiita article id: (.*) -->/);
  return m ? (m[1] ?? null) : null;
}

// Python `_stamp_synced_zenn_article_id` 相当。
// `body + "\n<!-- zenn article id: xxx -->\n"` の挙動を再現。
// body が \n で終わっていればコメント前に空行が 1 つ入り、そうでなければ入らない。
export function stampSyncedZennArticleIdInBody(
  body: string,
  zennArticleId: string,
): string {
  return `${body}\n<!-- zenn article id: ${zennArticleId} -->\n`;
}

// Python `_convert_body` 相当。per-line 変換 → body-level 変換の順に適用する。
// Python と同じ順序:
//   1. convertInfoNote / convertAlertNote / convertImagePath（per-line）
//   2. removeSyncedQiitaArticleIdComments（body-level: 古い qiita-id コメントを削除）
//   3. stampSyncedZennArticleIdInBody（body-level: Zenn-id コメントを末尾に追加）
//   4. convertFootnotes（body-level: `^[...]` を `[^N]` 参照 + 定義リストに）
export function convertBody(zennBody: string, zennArticleId: string): string {
  const perLine = zennBody
    .split("\n")
    .map((line) => convertInfoNote(line))
    .map((line) => convertAlertNote(line))
    .map((line) => convertImagePath(line, zennArticleId))
    .join("\n");
  const withoutQiitaComment = removeSyncedQiitaArticleIdComments(perLine);
  const withZennStamp = stampSyncedZennArticleIdInBody(
    withoutQiitaComment,
    zennArticleId,
  );
  return convertFootnotes(withZennStamp);
}

// Python `_convert_footnotes` 相当。Zenn の `^[...]` 記法を Qiita の `[^N]` 参照 +
// 末尾の `[^N]: ...` 定義リストに書き換える。
//
// 手順:
// 1. body 全体から `^[...]` を全マッチ取り出し（greedy `.*`: 同一行複数時は外側をまとめて 1 つ）
// 2. `^[...]` を一旦 `__FOOTNOTE__` トークンに置換
// 3. 末尾に 1 空行 + `[^N]: content` 定義を並べる
// 4. `__FOOTNOTE__` を出現順に `[^1]`, `[^2]`, ... で置換
export function convertFootnotes(body: string): string {
  const footnotes = Array.from(
    body.matchAll(/\^\[(.*)\]/g),
    (m) => m[1] ?? "",
  );
  if (footnotes.length === 0) return body;

  const marked = body.replace(/\^\[.*\]/g, "__FOOTNOTE__");
  const definitions = footnotes
    .map((fn, i) => `[^${i + 1}]: ${fn}\n`)
    .join("");
  const withDefs = `${marked}\n${definitions}`;

  return footnotes.reduce(
    (acc, _fn, i) => acc.replace("__FOOTNOTE__", `[^${i + 1}]`),
    withDefs,
  );
}

export function convertAlertNote(line: string): string {
  return line.replace(/^:::message alert$/, ":::note alert");
}

// Python `_convert_image_path` 相当。4 種の regex を順に適用する。
// - ローカル画像（/images/{articleId}/...）は raw.githubusercontent URL に書き換え
// - 外部URL画像はそのまま `<img>` タグ化
// - `=NNNx` 記法があれば width 属性に変換
export function convertImagePath(line: string, zennArticleId: string): string {
  return line
    .replace(
      // 1. ローカル画像 + 幅指定あり
      new RegExp(
        `!\\[(.*)\\]\\(/(images/${zennArticleId}/.*) =([0-9]*)x\\)`,
      ),
      `<img src="${RAW_BASE_URL}/$2" alt="$1" width="$3">`,
    )
    .replace(
      // 2. ローカル画像 + 幅指定なし
      new RegExp(`!\\[(.*)\\]\\(/(images/${zennArticleId}/.*)\\)`),
      `<img src="${RAW_BASE_URL}/$2" alt="$1">`,
    )
    .replace(
      // 3. 外部URL + 幅指定あり
      /!\[(.*)\]\((.*) =([0-9]*)x\)/,
      '<img src="$2" alt="$1" width="$3">',
    )
    .replace(
      // 4. 外部URL + 幅指定なし
      /!\[(.*)\]\((.*)\)/,
      '<img src="$2" alt="$1">',
    );
}
