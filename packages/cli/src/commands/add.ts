import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import fs from "fs-extra";
import path from "path";
import { detectProject, type ProjectConfig } from "../utils/detect-project.js";
import { getConfig, resolveAlias } from "../utils/config.js";
import {
  installDependencies,
  installShadcnComponent,
  ensureShadcnForm,
} from "../utils/dependencies.js";
import {
  getComponentManifest,
  readComponentFile,
  transformAliases,
  listComponents,
  type ManifestFile,
} from "../registry/index.js";

interface AddOptions {
  yes?: boolean;
  withForm?: boolean;
  deps?: boolean;
}

export async function addCommand(
  componentName: string,
  options: AddOptions
): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.cyan(`\n📦 Adicionando componente: ${componentName}\n`));

  // Get component manifest
  const manifest = await getComponentManifest(componentName);
  if (!manifest) {
    console.error(
      chalk.red(`❌ Componente "${componentName}" não encontrado.`)
    );
    console.log(chalk.dim("\nComponentes disponíveis:"));
    const components = await listComponents();
    components.forEach((c) => {
      console.log(chalk.dim(`  - ${c.name}`));
    });
    process.exit(1);
  }

  // Get config
  const config = await getConfig(cwd);
  if (!config) {
    console.error(chalk.red("❌ herow.config.json não encontrado."));
    console.log(chalk.dim("Execute primeiro: herow init"));
    process.exit(1);
  }

  // Detect project
  const spinner = ora("Detectando projeto...").start();
  let projectConfig: ProjectConfig;

  try {
    projectConfig = await detectProject(cwd);
    const projectLabel =
      projectConfig.type === "nextjs"
        ? "Next.js"
        : projectConfig.type === "vite"
          ? "Vite"
          : "Desconhecido";
    spinner.succeed(`Projeto detectado: ${projectLabel}`);
  } catch (error) {
    spinner.fail("Erro ao detectar projeto");
    throw error;
  }

  // Get framework config
  const framework = projectConfig.type === "nextjs" ? "nextjs" : "vite";
  const frameworkConfig = manifest.frameworks[framework];

  if (!frameworkConfig) {
    console.error(
      chalk.red(
        `❌ Componente "${componentName}" não suporta ${framework}.`
      )
    );
    process.exit(1);
  }

  // Ask about form integration
  let withForm = options.withForm ?? false;

  if (frameworkConfig.withForm && !options.yes && !options.withForm) {
    const response = await prompts({
      type: "confirm",
      name: "withForm",
      message: "Deseja integrar com React Hook Form?",
      initial: false,
    });

    if (response.withForm === undefined) {
      console.log(chalk.yellow("\nInstalação cancelada."));
      process.exit(0);
    }

    withForm = response.withForm;
  }

  // Collect files to install
  const filesToInstall: ManifestFile[] = [...frameworkConfig.files];
  if (withForm && frameworkConfig.withForm) {
    filesToInstall.push(...frameworkConfig.withForm.files);
  }

  // Collect dependencies
  const allDeps = [...manifest.dependencies];
  const allRegistryDeps = [...manifest.registryDependencies];

  if (withForm && frameworkConfig.withForm) {
    allDeps.push(...frameworkConfig.withForm.dependencies);
    allRegistryDeps.push(...frameworkConfig.withForm.registryDependencies);
  }

  // Show what will be installed
  console.log(chalk.dim("\nSerá instalado:"));
  console.log(chalk.dim(`  Componente: ${componentName}`));
  console.log(chalk.dim(`  Framework: ${framework}`));
  console.log(chalk.dim(`  Arquivos: ${filesToInstall.length}`));
  if (allDeps.length > 0) {
    console.log(chalk.dim(`  Dependências npm: ${allDeps.join(", ")}`));
  }
  if (allRegistryDeps.length > 0) {
    console.log(chalk.dim(`  Dependências shadcn: ${allRegistryDeps.join(", ")}`));
  }

  if (!options.yes) {
    const { confirm } = await prompts({
      type: "confirm",
      name: "confirm",
      message: "Continuar?",
      initial: true,
    });

    if (!confirm) {
      console.log(chalk.yellow("\nInstalação cancelada."));
      process.exit(0);
    }
  }

  // Install shadcn dependencies
  if (allRegistryDeps.length > 0) {
    for (const dep of allRegistryDeps) {
      await installShadcnComponent(dep, projectConfig, cwd);
    }
  }

  // Ensure shadcn/form if needed
  if (withForm) {
    await ensureShadcnForm(projectConfig, cwd);
  }

  // Install npm dependencies
  if (options.deps !== false && allDeps.length > 0) {
    await installDependencies(allDeps, projectConfig, cwd);
  }

  // Write component files
  const writeSpinner = ora("Escrevendo arquivos...").start();
  const writtenFiles: string[] = [];
  const aliasPrefix = config.aliases.ui?.startsWith("@/") ? "@/" : "../";

  try {
    for (const file of filesToInstall) {
      // Read file from registry
      const content = await readComponentFile(componentName, framework, file.name);

      // Transform aliases
      const transformedContent = transformAliases(content, aliasPrefix);

      // Determine target path
      let targetDir: string;
      let targetFileName = file.targetName || file.name;

      switch (file.target) {
        case "components":
          targetDir = resolveAlias(
            config.aliases.ui || config.aliases.components,
            cwd
          );
          break;
        case "actions":
          targetDir = path.join(
            cwd,
            projectConfig.actionsPath ||
              (projectConfig.srcDir ? "src/actions" : "actions")
          );
          break;
        case "hooks":
          targetDir = path.join(
            cwd,
            projectConfig.srcDir ? "src/hooks" : "hooks"
          );
          break;
        case "lib":
          targetDir = path.join(cwd, projectConfig.srcDir ? "src/lib" : "lib");
          break;
        default:
          targetDir = resolveAlias(config.aliases.components, cwd);
      }

      const targetPath = path.join(targetDir, targetFileName);
      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, transformedContent, "utf-8");
      writtenFiles.push(targetPath);
    }

    writeSpinner.succeed("Arquivos escritos!");
    writtenFiles.forEach((f) => console.log(chalk.dim(`  ${f}`)));
  } catch (error) {
    writeSpinner.fail("Erro ao escrever arquivos");
    throw error;
  }

  console.log(
    chalk.green(`\n✅ Componente ${componentName} adicionado com sucesso!`)
  );

  // Show usage example
  console.log(chalk.dim("\nExemplo de uso:"));
  if (framework === "nextjs") {
    console.log(
      chalk.cyan(`
// Em um Server Component (page.tsx, layout.tsx):
import { SelectEstado } from "${aliasPrefix}components/ui/select-estado"

export default async function Page() {
  return <SelectEstado />
}

// Em um Client Component:
import { SelectEstadoClient } from "${aliasPrefix}components/ui/select-estado-client"
// Passe os estados como prop
`)
    );
  } else {
    console.log(
      chalk.cyan(`
import { SelectEstado } from "${aliasPrefix}components/ui/select-estado"

<SelectEstado
  value={estado}
  onValueChange={setEstado}
  placeholder="Selecione um estado"
/>
`)
    );
  }
}
