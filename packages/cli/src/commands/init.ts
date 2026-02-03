import chalk from "chalk";
import ora from "ora";
import prompts from "prompts";
import fs from "fs-extra";
import path from "path";
import { detectProject } from "../utils/detect-project.js";
import { getConfig, writeConfig, getDefaultConfig } from "../utils/config.js";

interface InitOptions {
  yes?: boolean;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const cwd = process.cwd();

  console.log(chalk.cyan("\n🚀 Inicializando Herow Components...\n"));

  // Check if already initialized
  const existingConfig = await getConfig(cwd);
  if (existingConfig && !options.yes) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: "herow.config.json já existe. Deseja sobrescrever?",
      initial: false,
    });

    if (!overwrite) {
      console.log(chalk.yellow("Inicialização cancelada."));
      return;
    }
  }

  // Detect project
  const spinner = ora("Detectando configuração do projeto...").start();
  let projectConfig;

  try {
    projectConfig = await detectProject(cwd);
    spinner.succeed("Projeto detectado!");
  } catch (error) {
    spinner.fail("Erro ao detectar projeto");
    console.error(
      chalk.red(error instanceof Error ? error.message : "Erro desconhecido")
    );
    process.exit(1);
  }

  console.log(
    chalk.dim(`
  Tipo: ${projectConfig.type === "nextjs" ? "Next.js" : projectConfig.type === "vite" ? "Vite" : "Desconhecido"}
  TypeScript: ${projectConfig.isTypeScript ? "Sim" : "Não"}
  Diretório src: ${projectConfig.srcDir ? "Sim" : "Não"}
  Tailwind: ${projectConfig.hasTailwind ? "Sim" : "Não"}
  Package Manager: ${projectConfig.packageManager}
`)
  );

  let config = getDefaultConfig({
    isTypeScript: projectConfig.isTypeScript,
    srcDir: projectConfig.srcDir,
    hasTailwind: projectConfig.hasTailwind,
  });

  if (!options.yes) {
    const responses = await prompts([
      {
        type: "select",
        name: "style",
        message: "Qual estilo você prefere?",
        choices: [
          { title: "Default", value: "default" },
          { title: "New York", value: "new-york" },
        ],
        initial: 0,
      },
      {
        type: "text",
        name: "componentsAlias",
        message: "Alias para componentes:",
        initial: config.aliases.components,
      },
      {
        type: "text",
        name: "uiAlias",
        message: "Alias para componentes UI:",
        initial: config.aliases.ui,
      },
      {
        type: "text",
        name: "registry",
        message: "URL do registry customizado (deixe vazio para usar o padrão):",
        initial: "",
      },
    ]);

    if (responses.componentsAlias === undefined) {
      console.log(chalk.yellow("\nInicialização cancelada."));
      process.exit(0);
    }

    config = {
      ...config,
      style: responses.style,
      aliases: {
        ...config.aliases,
        components: responses.componentsAlias,
        ui: responses.uiAlias,
      },
      registry: responses.registry || undefined,
    };
  }

  // Write config
  const writeSpinner = ora("Salvando configuração...").start();

  try {
    await writeConfig(cwd, config);
    writeSpinner.succeed("Configuração salva em herow.config.json");
  } catch (error) {
    writeSpinner.fail("Erro ao salvar configuração");
    throw error;
  }

  // Create directories
  const uiDir = path.join(cwd, projectConfig.componentsPath);
  if (!(await fs.pathExists(uiDir))) {
    await fs.ensureDir(uiDir);
    console.log(chalk.dim(`  Criado: ${projectConfig.componentsPath}`));
  }

  if (projectConfig.actionsPath) {
    const actionsDir = path.join(cwd, projectConfig.actionsPath);
    if (!(await fs.pathExists(actionsDir))) {
      await fs.ensureDir(actionsDir);
      console.log(chalk.dim(`  Criado: ${projectConfig.actionsPath}`));
    }
  }

  console.log(chalk.green("\n✅ Herow Components inicializado com sucesso!"));
  console.log(chalk.dim("\nPróximos passos:"));
  console.log(chalk.cyan("  herow add select-estado"));
  console.log(chalk.cyan("  herow list\n"));
}
