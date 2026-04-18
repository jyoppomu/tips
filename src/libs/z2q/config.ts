import path from "node:path";

// src/libs/z2q/config.ts → ../../.. でリポジトリルート
export const repositoryRoot = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "..",
);
export const nodeModulesDirectory = path.join(repositoryRoot, "node_modules");
export const zennArticleDirectory = path.join(repositoryRoot, "articles");
export const qiitaArticleDirectory = path.join(repositoryRoot, "public");

export const config = {
  repositoryRoot,
  nodeModulesDirectory,
  zennArticleDirectory,
  qiitaArticleDirectory,
} as const;
