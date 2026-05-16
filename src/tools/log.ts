import { defineCommand } from "citty";
import { existsSync } from "node:fs";
import { join } from "node:path";

const TODO_FILE = "TODO.md";
const CHANGELOG_FILE = "CHANGELOG.md";
const VALID_CHANGELOG_TYPES = ["added", "changed", "deprecated", "removed", "fixed", "security"];

export default defineCommand({
  meta: {
    name: "log",
    description: "Manage project tasks and changelogs following rigid markdown standards.",
  },
  args: {
    action: {
      type: "positional",
      description: "Action to perform: 'todo', 'done', or 'changelog'",
      required: true,
    },
    payload: {
      type: "positional",
      description: "The task description, task matcher, or changelog type (e.g. 'added')",
      required: true,
    },
    message: {
      type: "positional",
      description: "The changelog message (only required if action is 'changelog')",
      required: false,
    },
    json: {
      type: "boolean",
      description: "Output JSON result",
      default: false,
    },
  },
  async run({ args }) {
    const action = args.action.toLowerCase();
    
    if (action === "todo") {
      const task = args.payload;
      const target = join(process.cwd(), TODO_FILE);
      let content = existsSync(target) ? await Bun.file(target).text() : "# Tasks\n\n## Active\n\n## Laundry List\n\n## Backlog\n";
      
      // Inject into Active if it exists, else append
      if (content.includes("## Active")) {
        content = content.replace("## Active", `## Active\n- [ ] ${task}`);
      } else {
        content += `\n- [ ] ${task}`;
      }
      
      await Bun.write(target, content);
      console.log(`Added task to TODO.md: ${task}`);
      
    } else if (action === "done") {
      const matcher = args.payload.toLowerCase();
      const target = join(process.cwd(), TODO_FILE);
      if (!existsSync(target)) {
        console.error("TODO.md does not exist.");
        process.exit(1);
      }
      
      const lines = (await Bun.file(target).text()).split("\n");
      let found = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(matcher) && lines[i].includes("- [ ]")) {
          lines[i] = lines[i].replace("- [ ]", "- [x]");
          found = true;
          console.log(`Marked as done: ${lines[i]}`);
          break; // Only check off the first match
        }
      }
      
      if (!found) {
        console.error(`No pending task found matching: ${matcher}`);
        process.exit(1);
      }
      
      await Bun.write(target, lines.join("\n"));
      
    } else if (action === "changelog") {
      const type = args.payload.toLowerCase();
      const message = args.message;
      
      if (!VALID_CHANGELOG_TYPES.includes(type)) {
        console.error(`Invalid changelog type. Must be one of: ${VALID_CHANGELOG_TYPES.join(", ")}`);
        process.exit(1);
      }
      if (!message) {
        console.error("Changelog message is required.");
        process.exit(1);
      }
      
      const target = join(process.cwd(), CHANGELOG_FILE);
      let content = existsSync(target) ? await Bun.file(target).text() : "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).\n\n## [Unreleased]\n";
      
      const properType = type.charAt(0).toUpperCase() + type.slice(1);
      const typeHeader = `### ${properType}`;
      
      // Ensure Unreleased section exists
      if (!content.includes("## [Unreleased]")) {
         content += "\n## [Unreleased]\n";
      }
      
      // Find the Unreleased block
      const unreleasedIndex = content.indexOf("## [Unreleased]");
      const nextVersionIndex = content.indexOf("## [", unreleasedIndex + 1);
      const unreleasedBlock = nextVersionIndex === -1 ? content.slice(unreleasedIndex) : content.slice(unreleasedIndex, nextVersionIndex);
      
      let newBlock = unreleasedBlock;
      if (newBlock.includes(typeHeader)) {
        newBlock = newBlock.replace(typeHeader, `${typeHeader}\n- ${message}`);
      } else {
        newBlock += `\n${typeHeader}\n- ${message}\n`;
      }
      
      content = content.replace(unreleasedBlock, newBlock);
      await Bun.write(target, content);
      console.log(`Added to CHANGELOG.md under [Unreleased] -> ${properType}: ${message}`);
      
    } else {
      console.error("Invalid action. Must be 'todo', 'done', or 'changelog'.");
      process.exit(1);
    }
  },
});
