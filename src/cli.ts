import { defineCommand, runMain } from "citty";
import { tools } from "./tools";
import pkg from "../package.json";

const main = defineCommand({
  meta: {
    name: "monk",
    version: pkg.version,
    description: "The holy toolkit for the monk developer.",
  },
  subCommands: Object.fromEntries(
    tools.map((t) => [t.meta.name, t]),
  ),
  run({ rawArgs }) {
    if (rawArgs && rawArgs.length > 0) return;
    console.log("Available tools:\n");
    for (const t of tools) {
      console.log(`  ${t.meta.name!.padEnd(18)} ${t.meta.description ?? ""}`);
    }
    console.log("\nRun `monk <tool> --help` for details.");
  },
});

runMain(main);
