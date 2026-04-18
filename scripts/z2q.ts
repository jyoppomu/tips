import { Command } from "commander";
import { z2q } from "../src/libs/z2q/index.ts";

const program = new Command();

program
  .name("z2q")
  .description("Convert article of Zenn to one of Qiita")
  .argument("<id>", "ID of the article of Zenn to convert")
  .action(async (articleId: string) => {
    await z2q({ articleId });
  });

await program.parseAsync(process.argv);
