import fs from "fs-extra";
import path from "path";
import { z } from "zod";

export const configSchema = z.object({
  $schema: z.string().optional(),
  style: z.enum(["default", "new-york"]).default("default"),
  typescript: z.boolean().default(true),
  tailwind: z.object({
    config: z.string(),
    css: z.string(),
    baseColor: z.string(),
  }),
  aliases: z.object({
    components: z.string(),
    utils: z.string(),
    ui: z.string().optional(),
    lib: z.string().optional(),
    hooks: z.string().optional(),
  }),
  registry: z.string().optional(),
});

export type HerowConfig = z.infer<typeof configSchema>;

const CONFIG_FILE = "herow.config.json";

export async function getConfig(cwd: string): Promise<HerowConfig | null> {
  const configPath = path.join(cwd, CONFIG_FILE);

  if (!(await fs.pathExists(configPath))) {
    return null;
  }

  try {
    const config = await fs.readJson(configPath);
    return configSchema.parse(config);
  } catch (error) {
    return null;
  }
}

export async function writeConfig(
  cwd: string,
  config: HerowConfig
): Promise<void> {
  const configPath = path.join(cwd, CONFIG_FILE);
  await fs.writeJson(configPath, config, { spaces: 2 });
}

export function getDefaultConfig(options: {
  isTypeScript: boolean;
  srcDir: boolean;
  hasTailwind: boolean;
}): HerowConfig {
  const { isTypeScript, srcDir } = options;
  const prefix = srcDir ? "@/" : "./";

  return {
    $schema: "https://herow.dev/schema.json",
    style: "default",
    typescript: isTypeScript,
    tailwind: {
      config: srcDir ? "tailwind.config.ts" : "tailwind.config.js",
      css: srcDir ? "src/app/globals.css" : "app/globals.css",
      baseColor: "slate",
    },
    aliases: {
      components: `${prefix}components`,
      utils: `${prefix}lib/utils`,
      ui: `${prefix}components/ui`,
      lib: `${prefix}lib`,
      hooks: `${prefix}hooks`,
    },
  };
}

export function resolveAlias(alias: string, cwd: string): string {
  // Convert @/ aliases to actual paths
  if (alias.startsWith("@/")) {
    return path.join(cwd, "src", alias.slice(2));
  }
  if (alias.startsWith("./")) {
    return path.join(cwd, alias.slice(2));
  }
  return path.join(cwd, alias);
}
