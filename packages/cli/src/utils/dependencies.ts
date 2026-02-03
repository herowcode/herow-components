import { execa } from "execa";
import ora from "ora";
import chalk from "chalk";
import { getInstallCommand, getExecCommand, type ProjectConfig } from "./detect-project.js";

export async function installDependencies(
  dependencies: string[],
  config: ProjectConfig,
  cwd: string
): Promise<void> {
  if (dependencies.length === 0) return;

  const spinner = ora({
    text: `Instalando dependências: ${chalk.cyan(dependencies.join(", "))}`,
  }).start();

  try {
    const command = getInstallCommand(config.packageManager, dependencies);
    const [cmd, ...args] = command.split(" ");

    await execa(cmd, args, { cwd, stdio: "pipe" });

    spinner.succeed(
      `Dependências instaladas: ${chalk.green(dependencies.join(", "))}`
    );
  } catch (error) {
    spinner.fail(`Falha ao instalar dependências`);
    throw error;
  }
}

export async function installShadcnComponent(
  componentName: string,
  config: ProjectConfig,
  cwd: string
): Promise<void> {
  const spinner = ora({
    text: `Instalando shadcn/ui: ${chalk.cyan(componentName)}`,
  }).start();

  try {
    const command = getExecCommand(
      config.packageManager,
      `shadcn@latest add ${componentName} -y`
    );
    const [cmd, ...args] = command.split(" ");

    await execa(cmd, args, { cwd, stdio: "pipe" });

    spinner.succeed(
      `shadcn/ui instalado: ${chalk.green(componentName)}`
    );
  } catch (error) {
    spinner.fail(`Falha ao instalar shadcn/ui ${componentName}`);
    throw error;
  }
}

export async function ensureShadcnForm(
  config: ProjectConfig,
  cwd: string
): Promise<void> {
  if (config.hasShadcnForm) {
    return;
  }

  console.log(
    chalk.yellow("\n⚠️  shadcn/form não detectado. Instalando...")
  );

  // Install required dependencies
  const deps = ["react-hook-form", "@hookform/resolvers", "zod"];
  await installDependencies(
    deps.filter(
      (d) =>
        !config.hasReactHookForm ||
        (d !== "react-hook-form" && d !== "@hookform/resolvers" && d !== "zod")
    ),
    config,
    cwd
  );

  // Install shadcn form component
  await installShadcnComponent("form", config, cwd);
}

export interface DependencyCheck {
  missing: string[];
  shadcnMissing: string[];
}

export function checkDependencies(
  required: string[],
  config: ProjectConfig
): DependencyCheck {
  // This is a simplified check - in production you'd read package.json
  return {
    missing: required,
    shadcnMissing: [],
  };
}
