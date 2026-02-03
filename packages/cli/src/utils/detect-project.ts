import fs from "fs-extra";
import path from "path";

export type ProjectType = "nextjs" | "vite" | "unknown";

export interface ProjectConfig {
  type: ProjectType;
  isTypeScript: boolean;
  srcDir: boolean;
  componentsPath: string;
  actionsPath?: string;
  hasReactHookForm: boolean;
  hasShadcnForm: boolean;
  hasTailwind: boolean;
  packageManager: "npm" | "pnpm" | "yarn" | "bun";
}

async function detectPackageManager(
  cwd: string
): Promise<"npm" | "pnpm" | "yarn" | "bun"> {
  if (await fs.pathExists(path.join(cwd, "bun.lockb"))) return "bun";
  if (await fs.pathExists(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (await fs.pathExists(path.join(cwd, "yarn.lock"))) return "yarn";
  return "npm";
}

export async function detectProject(cwd: string): Promise<ProjectConfig> {
  const pkgPath = path.join(cwd, "package.json");

  if (!(await fs.pathExists(pkgPath))) {
    throw new Error(
      "package.json não encontrado. Execute este comando na raiz do seu projeto."
    );
  }

  const pkg = await fs.readJson(pkgPath);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Detect project type
  let type: ProjectType = "unknown";
  if ("next" in deps) {
    type = "nextjs";
  } else if ("vite" in deps) {
    type = "vite";
  }

  // Detect TypeScript
  const isTypeScript =
    (await fs.pathExists(path.join(cwd, "tsconfig.json"))) ||
    "typescript" in deps;

  // Detect src directory
  const srcDir = await fs.pathExists(path.join(cwd, "src"));

  // Determine components path
  let componentsPath: string;
  if (type === "nextjs") {
    // Check for app router vs pages router
    const hasAppDir =
      (await fs.pathExists(path.join(cwd, "app"))) ||
      (await fs.pathExists(path.join(cwd, "src", "app")));

    if (srcDir) {
      componentsPath = "src/components/ui";
    } else {
      componentsPath = "components/ui";
    }
  } else {
    componentsPath = srcDir ? "src/components/ui" : "components/ui";
  }

  // Actions path for Next.js
  let actionsPath: string | undefined;
  if (type === "nextjs") {
    if (srcDir) {
      actionsPath = "src/actions";
    } else {
      actionsPath = "actions";
    }
  }

  // Detect React Hook Form and Shadcn Form
  const hasReactHookForm = "react-hook-form" in deps;
  const hasShadcnForm =
    hasReactHookForm && "@hookform/resolvers" in deps && "zod" in deps;

  // Detect Tailwind
  const hasTailwind =
    "tailwindcss" in deps ||
    (await fs.pathExists(path.join(cwd, "tailwind.config.js"))) ||
    (await fs.pathExists(path.join(cwd, "tailwind.config.ts")));

  const packageManager = await detectPackageManager(cwd);

  return {
    type,
    isTypeScript,
    srcDir,
    componentsPath,
    actionsPath,
    hasReactHookForm,
    hasShadcnForm,
    hasTailwind,
    packageManager,
  };
}

export function getInstallCommand(
  packageManager: ProjectConfig["packageManager"],
  packages: string[]
): string {
  const pkgList = packages.join(" ");
  switch (packageManager) {
    case "pnpm":
      return `pnpm add ${pkgList}`;
    case "yarn":
      return `yarn add ${pkgList}`;
    case "bun":
      return `bun add ${pkgList}`;
    default:
      return `npm install ${pkgList}`;
  }
}

export function getExecCommand(
  packageManager: ProjectConfig["packageManager"],
  command: string
): string {
  switch (packageManager) {
    case "pnpm":
      return `pnpm dlx ${command}`;
    case "yarn":
      return `yarn dlx ${command}`;
    case "bun":
      return `bunx ${command}`;
    default:
      return `npx ${command}`;
  }
}
