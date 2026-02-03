import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ManifestFile {
  name: string;
  target: "components" | "actions" | "hooks" | "lib";
  targetName?: string;
}

export interface FrameworkConfig {
  files: ManifestFile[];
  withForm?: {
    files: ManifestFile[];
    dependencies: string[];
    registryDependencies: string[];
  };
}

export interface ComponentManifest {
  name: string;
  description: string;
  version: string;
  registryDependencies: string[];
  dependencies: string[];
  devDependencies: string[];
  frameworks: {
    nextjs: FrameworkConfig;
    vite: FrameworkConfig;
  };
}

export async function getRegistryPath(): Promise<string> {
  // Try multiple possible paths
  const possiblePaths = [
    // Development: running from packages/cli/dist
    path.resolve(__dirname, "../../../registry"),
    // Development: running from packages/cli/src
    path.resolve(__dirname, "../../registry"),
    // Monorepo root
    path.resolve(__dirname, "../../../../packages/registry"),
    // Installed via npm (registry bundled)
    path.resolve(__dirname, "../registry"),
  ];

  for (const registryPath of possiblePaths) {
    if (await fs.pathExists(registryPath)) {
      return registryPath;
    }
  }

  throw new Error(
    `Registry não encontrado. Paths tentados:\n${possiblePaths.map((p) => `  - ${p}`).join("\n")}`
  );
}

export async function listComponents(): Promise<
  Array<{ name: string; description: string; hasFormVariant: boolean }>
> {
  const registryPath = await getRegistryPath();
  const entries = await fs.readdir(registryPath, { withFileTypes: true });

  const components: Array<{
    name: string;
    description: string;
    hasFormVariant: boolean;
  }> = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "node_modules") continue;

    const manifestPath = path.join(registryPath, entry.name, "manifest.json");
    if (await fs.pathExists(manifestPath)) {
      const manifest: ComponentManifest = await fs.readJson(manifestPath);
      components.push({
        name: manifest.name,
        description: manifest.description,
        hasFormVariant:
          !!manifest.frameworks.nextjs?.withForm ||
          !!manifest.frameworks.vite?.withForm,
      });
    }
  }

  return components;
}

export async function getComponentManifest(
  componentName: string
): Promise<ComponentManifest | null> {
  const registryPath = await getRegistryPath();
  const manifestPath = path.join(registryPath, componentName, "manifest.json");

  if (!(await fs.pathExists(manifestPath))) {
    return null;
  }

  return fs.readJson(manifestPath);
}

export async function readComponentFile(
  componentName: string,
  framework: "nextjs" | "vite",
  fileName: string
): Promise<string> {
  const registryPath = await getRegistryPath();
  const filePath = path.join(registryPath, componentName, framework, fileName);

  if (!(await fs.pathExists(filePath))) {
    throw new Error(`Arquivo não encontrado: ${filePath}`);
  }

  return fs.readFile(filePath, "utf-8");
}

export function transformAliases(
  content: string,
  aliasPrefix: string
): string {
  // Replace @/ with the correct alias prefix
  return content.replace(/@\//g, aliasPrefix);
}
