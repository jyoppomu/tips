# TIPS

[![Astro](https://img.shields.io/badge/Astro-Starlight-ff5d01.svg)](https://starlight.astro.build/)

## Articles

<!-- markdownlint-disable MD033 -->
<div align="center" style="display: flex; justify-content: space-around;">
  <a href="https://ayukiyoshida.github.io/tips/">
      <img src="assets/images/tips.png" alt="french-fry" style="width: auto; height: 72px; object-fit: contain;"/>
  </a>
  <a href="https://zenn.dev/jyoppomu">
      <img src="https://static.zenn.studio/images/logo.png" alt="zenn-logo" style="width: auto; height: 72px; object-fit: contain;"/>
  </a>
  <a href="https://qiita.com/jyoppomu">
      <img src="assets/images/qitta-logo.png" alt="qiita-log" style="width: auto; height: 72px; object-fit: contain;"/>
  </a>
</div>

## Requirements

- [mise](https://mise.jdx.dev/)

## Setup

1. Derive source code

   ```shell
   git clone git@github.com:aYukiYoshida/tips.git
   ```

2. Install packages

   ```shell
   mise install
   ```

## Commands

### for Astro (documentation)

- Start the live-reloading docs server

  ```shell
  npm run preview:docs
  ```

- Build the documentations

  ```shell
  npm run build:docs
  ```

### for Marp

- Start the live-reloading slides server

  ```shell
  npm run preview:slides
  ```

- Build the slides

  ```shell
  npm run build:slides
  ```

### for Zenn

- Create a new article

  ```shell
  npm run create:zenn
  ```

- Start the live-reloading docs server

  ```shell
  npm run preview:zenn
  ```

### for Qiita

- Create a new article

  ```shell
  npm run create:qiita -- <BASE_NAME>
  ```

- Start the live-reloading docs server

  ```shell
  npm run preview:qiita
  ```

## Project Layout

```text
src/content/
  docs/           # Articles for Astro (Starlight)
  slides/         # Slides for Marp
articles/         # Articles for Zenn
books/            # Books for Zenn
public/           # Articles for Qiita
assets/           # Static assets (favicon etc.) served by Astro
astro.config.mjs  # Configuration file for Astro + Starlight
.marprc.yml       # Configuration file for Marp
qiita.config.json # Configuration file for Qiita CLI
```

## Sync Articles between Zenn and Qiita

### Workflow

1. Zenn の記事を新規に作成する。もしくは、既存の記事を更新する。
2. Zenn の記事の新規作成もしくは、更新についてコミットする。
3. 前述のコミットを main ブランチに push する。
4. main ブランチでの変更が検知され Zenn が提供する機能により自動でデプロイされる。
5. main ブランチでの変更により [sync-articles-from-zenn-to-qiita](./.github/workflows/zenn_to_qiita.yml) のワークフローが実行される。以下の処理が実行される。
   1. Zenn の記事が Qiita に変換する。
   2. 同期する Qiita の記事が存在しない場合は、新規に作成され、その id が Zenn の記事の末尾に追記される。この Zenn の記事の変更について、コミットする。
   3. 新規作成もしくは、更新によらず Qiita の記事の変更について、コミットする。
   4. Qiita の記事を公開する。このとき Qiita CLI により front matter が更新される。この Qiita の記事の変更については、自動でコミットされる。

### Convert Article Command

- Convert article of Zenn to that of Qiita

  ```shell
  npm run z2q <ARTICLE_ID>
  ```

## Guide

- Astro / Starlight
  - <https://starlight.astro.build/>
- Marp
  - <https://marp.app/>
- Zenn
  - [GitHubリポジトリでZennのコンテンツを管理する](https://zenn.dev/zenn/articles/connect-to-github)
  - [Markdown記法](https://zenn.dev/zenn/articles/markdown-guide)
  - [CLI](https://zenn.dev/zenn/articles/zenn-cli-guide)
- Qiita
  - [Markdown記法](https://qiita.com/Qiita/items/c686397e4a0f4f11683d)
  - [CLI](https://github.com/increments/qiita-cli)
