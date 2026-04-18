import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

export default defineConfig({
  site: "https://jyoppomu.github.io",
  base: "/tips",
  outDir: "./dist",
  publicDir: "./static",
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [[rehypeKatex, { strict: "ignore" }]],
  },
  integrations: [
    starlight({
      title: "TIPS",
      description: "This is my yummy tips",
      favicon: "/favicon.ico",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/jyoppomu/tips",
        },
      ],
      customCss: ["./src/styles/custom.css", "katex/dist/katex.min.css"],
      sidebar: [
        { label: "TOP", slug: "index" },
        {
          label: "STATISTICS",
          items: [
            { label: "descriptive statistics", slug: "statistics/descriptive_statistics" },
            { label: "outlie", slug: "statistics/outlie" },
            { label: "significance", slug: "statistics/significance" },
            { label: "statistical hypothesis", slug: "statistics/statistical_hypothesis" },
            { slug: "statistics/ftest" },
            { slug: "statistics/run_test" },
            {
              label: "Bayesian",
              items: [
                { label: "Bayesian estimation", slug: "statistics/bayesian/bayesian_estimation" },
                { label: "Bayesian statistics", slug: "statistics/bayesian/bayesian_statistics" },
              ],
            },
          ],
        },
        {
          label: "PHYSICS",
          items: [
            {
              label: "definition",
              items: [{ label: "solid angle", slug: "physics/definition/solid_angle" }],
            },
            {
              label: "tools",
              items: [{ label: "ROOT", slug: "physics/tools/root" }],
            },
          ],
        },
        {
          label: "Python",
          items: [{ label: "lmfit", slug: "python/lmfit" }],
        },
        {
          label: "NLP",
          items: [{ label: "How to install tools", slug: "nlp/install_tools" }],
        },
        {
          label: "LaTeX",
          items: [
            { label: "Horizontal line in LaTeX", slug: "latex/dash" },
            { label: "Make LaTeX formulas online images", slug: "latex/online_equation" },
          ],
        },
        {
          label: "Testing",
          items: [
            { label: "automated testing", slug: "testing/automated_testing" },
            { label: "Playwright", slug: "testing/playwright" },
          ],
        },
        {
          label: "WebFrontEnd",
          items: [
            {
              label: "HTML",
              items: [{ label: "inline-block", slug: "webfrontend/html/inline_block" }],
            },
          ],
        },
        {
          label: "English",
          items: [
            { slug: "english/appreciate" },
            { slug: "english/one_that" },
            { slug: "english/just_remember" },
            { slug: "english/adverb" },
            { slug: "english/conjunction" },
          ],
        },
        {
          label: "Favorites",
          items: [{ label: "心に残る名言", slug: "favorites/word_of_wisdom" }],
        },
      ],
    }),
  ],
});
