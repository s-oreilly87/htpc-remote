import { execFile } from "child_process";
import path from "path";

export async function runCommand(command: string, args: string[] = []): Promise<void> {
  const executable = getExecutable(command);

  await new Promise<void>((resolve, reject) => {
    execFile(executable, args, (error, _stdout, stderr) => {
      if (error) {
        const stderrMessage = stderr?.toString().trim();
        const details = [
          `Command failed: ${executable} ${args.join(" ")}`.trim(),
          typeof error.code === "number" ? `exit code ${error.code}` : undefined,
          stderrMessage || error.message,
        ]
          .filter(Boolean)
          .join(" - ");

        console.error(details);
        reject(new Error(details));
      } else {
        resolve();
      }
    });
  });
}

function getExecutable(command: string): string {
  const prefix = process.env.SHELL_SCRIPT_PREFIX;
  if (!prefix) {
    return command;
  }

  return path.join(prefix, command);
}
