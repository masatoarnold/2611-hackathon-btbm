import { join } from "node:path";

// Keys come from env vars first, then from API_key.txt (project root or the folder above it).
// The file may hold several keys, one per line; each is picked by its prefix.
const PROJECT_ROOT = join(import.meta.dir, "../..");
const KEY_FILES = [
  join(PROJECT_ROOT, "API_key.txt"),
  join(PROJECT_ROOT, "../API_key.txt"),
];

const PROVIDERS = {
  openrouter: { env: "OPENROUTER_API_KEY", prefix: "sk-or-" },
  anthropic: { env: "ANTHROPIC_API_KEY", prefix: "sk-ant-" },
} as const;

export async function loadApiKey(
  provider: keyof typeof PROVIDERS,
): Promise<string | undefined> {
  const { env, prefix } = PROVIDERS[provider];
  if (process.env[env]) return process.env[env];

  for (const path of KEY_FILES) {
    const file = Bun.file(path);
    if (!(await file.exists())) continue;
    const key = (await file.text())
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line.startsWith(prefix));
    if (key) return key;
  }
}
