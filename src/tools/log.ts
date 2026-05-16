import { defineCommand } from "citty";
import { existsSync } from "node:fs";
import { join } from "node:path";

const TODO_FILE = "TODO.md";

export default defineCommand({
  meta: {
    name: "log",
    description: "Manage project tasks following rigid markdown standards.",
  },
  args: {
    action: {
      type: "positional",
      description: "Action to perform: 'todo' or 'done'",
      required: true,
    },
    payload: {
      type: "positional",
      description: "The task description or task matcher",
      required: true,
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
      
    } else {
      console.error("Invalid action. Must be 'todo' or 'done'.");
      process.exit(1);
    }
  },
});
