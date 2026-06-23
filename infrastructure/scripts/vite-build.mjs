import { spawn } from "node:child_process";

const filteredWarnings = [
  'The plugin "vite-tsconfig-paths" is detected. Vite now supports tsconfig paths resolution natively',
];

const child = spawn("vite", ["build", ...process.argv.slice(2)], {
  shell: true,
  stdio: ["ignore", "pipe", "pipe"],
});

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
});

child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  const lines = text.split(/(?<=\n)/);
  for (const line of lines) {
    if (filteredWarnings.some((warning) => line.includes(warning))) continue;
    process.stderr.write(line);
  }
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
