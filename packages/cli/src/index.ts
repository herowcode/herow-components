#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { addCommand } from "./commands/add.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";

const program = new Command();

program
  .name("herow")
  .description(
    chalk.cyan("🚀 Herow Components CLI") +
      "\n   Instale componentes React diretamente do GitHub"
  )
  .version("0.1.0");

program
  .command("init")
  .description("Inicializa a configuração do Herow no seu projeto")
  .option("-y, --yes", "Pular prompts e usar configurações padrão")
  .action(initCommand);

program
  .command("add")
  .description("Adiciona um componente ao seu projeto")
  .argument("<component>", "Nome do componente (ex: select-estado)")
  .option("-y, --yes", "Pular prompts de confirmação")
  .option("--with-form", "Incluir integração com React Hook Form")
  .option("--no-deps", "Não instalar dependências automaticamente")
  .action(addCommand);

program
  .command("list")
  .alias("ls")
  .description("Lista todos os componentes disponíveis")
  .action(listCommand);

program.parse();
