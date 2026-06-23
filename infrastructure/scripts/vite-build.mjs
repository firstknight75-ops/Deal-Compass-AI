import { spawn } from "node:child_process";

const filteredWarnings = ["vite-tsconfig-paths"];

function filterOutput(chunk) {
  const text = chunk.toString();
  if (filteredWarnings.some((warning) => text.includes(warning))) return "";
  return text;
}

const child = spawn("vite", ["build", ...process.argv.slice(2)], {
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(filterOutput(chunk));
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
