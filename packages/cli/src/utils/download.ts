import fetch from "node-fetch";
import fs from "fs-extra";
import path from "path";

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/herowcode/herow-components/main";
const GITHUB_API_BASE =
  "https://api.github.com/repos/herowcode/herow-components";

export interface ComponentFile {
  name: string;
  path: string;
  content: string;
}

export interface ComponentManifest {
  name: string;
  description: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: {
    name: string;
    path: string;
    type: "component" | "action" | "hook" | "lib" | "type";
  }[];
  variants?: {
    withForm?: {
      files: {
        name: string;
        path: string;
        type: "component" | "action" | "hook" | "lib" | "type";
      }[];
      dependencies: string[];
    };
  };
}

export async function fetchComponentManifest(
  componentName: string,
  customRegistry?: string
): Promise<ComponentManifest> {
  const baseUrl = customRegistry || GITHUB_RAW_BASE;
  const url = `${baseUrl}/packages/registry/${componentName}/manifest.json`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Componente "${componentName}" não encontrado no registry.`
    );
  }

  return (await response.json()) as ComponentManifest;
}

export async function fetchComponentFile(
  componentName: string,
  filePath: string,
  customRegistry?: string
): Promise<string> {
  const baseUrl = customRegistry || GITHUB_RAW_BASE;
  const url = `${baseUrl}/packages/registry/${componentName}/${filePath}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Arquivo "${filePath}" não encontrado para ${componentName}`);
  }

  return await response.text();
}

export async function downloadComponent(
  componentName: string,
  options: {
    withForm?: boolean;
    customRegistry?: string;
  } = {}
): Promise<ComponentFile[]> {
  const manifest = await fetchComponentManifest(
    componentName,
    options.customRegistry
  );
  const files: ComponentFile[] = [];

  // Download main files
  for (const file of manifest.files) {
    const content = await fetchComponentFile(
      componentName,
      file.path,
      options.customRegistry
    );
    files.push({
      name: file.name,
      path: file.path,
      content,
    });
  }

  // Download form variant files if requested
  if (options.withForm && manifest.variants?.withForm) {
    for (const file of manifest.variants.withForm.files) {
      const content = await fetchComponentFile(
        componentName,
        file.path,
        options.customRegistry
      );
      files.push({
        name: file.name,
        path: file.path,
        content,
      });
    }
  }

  return files;
}

export async function writeComponentFiles(
  files: ComponentFile[],
  targetDir: string,
  transform?: (content: string, filename: string) => string
): Promise<void> {
  for (const file of files) {
    const targetPath = path.join(targetDir, file.name);
    await fs.ensureDir(path.dirname(targetPath));

    let content = file.content;
    if (transform) {
      content = transform(content, file.name);
    }

    await fs.writeFile(targetPath, content, "utf-8");
  }
}
