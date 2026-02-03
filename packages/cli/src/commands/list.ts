import chalk from "chalk";
import { listComponents } from "../registry/index.js";

export async function listCommand(): Promise<void> {
  console.log(chalk.cyan("\n📦 Componentes disponíveis:\n"));

  try {
    const components = await listComponents();

    if (components.length === 0) {
      console.log(chalk.dim("  Nenhum componente encontrado no registry."));
      return;
    }

    for (const component of components) {
      console.log(`  ${chalk.green("●")} ${chalk.bold(component.name)}`);
      console.log(chalk.dim(`    ${component.description}`));

      if (component.hasFormVariant) {
        console.log(
          chalk.yellow(`    📝 Suporta integração com React Hook Form`)
        );
      }

      console.log();
    }

    console.log(chalk.dim("Para adicionar um componente:"));
    console.log(chalk.cyan("  herow add <nome-do-componente>\n"));
  } catch (error) {
    console.error(
      chalk.red(
        `❌ Erro ao listar componentes: ${error instanceof Error ? error.message : "Erro desconhecido"}`
      )
    );
    process.exit(1);
  }
}
