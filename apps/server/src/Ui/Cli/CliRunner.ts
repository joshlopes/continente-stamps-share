import { injectable, multiInject, optional } from 'inversify';
import { Command } from 'commander';
import type { CliCommand, CliContext } from '../../Domain/CliCommand/index.js';

const CLI_COMMAND = Symbol.for('CliCommand');

class CommanderContext implements CliContext {
  constructor(
    private readonly options: Record<string, unknown>,
    private readonly args: Record<string, unknown>
  ) {}

  getOption<T = string>(name: string): T | undefined {
    return this.options[name] as T | undefined;
  }

  getArgument<T = string>(name: string): T | undefined {
    return this.args[name] as T | undefined;
  }

  hasOption(name: string): boolean {
    return name in this.options;
  }

  hasArgument(name: string): boolean {
    return name in this.args;
  }
}

@injectable()
export class CliRunner {
  private readonly program: Command;

  constructor(
    @multiInject(CLI_COMMAND) @optional()
    private readonly commands: CliCommand[] = []
  ) {
    this.program = new Command();
    this.program.name('stamps-share-cli').description('Continente Stamps Share CLI').version('1.0.0');
    this.registerCommands();
  }

  private registerCommands(): void {
    for (const cmd of this.commands) {
      const command = this.program.command(cmd.name).description(cmd.description);

      // Register options
      if (cmd.options) {
        for (const opt of cmd.options) {
          const flags = opt.short
            ? `-${opt.short}, --${opt.name} <value>`
            : `--${opt.name} <value>`;
          
          if (opt.required) {
            command.requiredOption(flags, opt.description, opt.defaultValue);
          } else {
            command.option(flags, opt.description, opt.defaultValue);
          }
        }
      }

      // Register arguments
      if (cmd.arguments) {
        for (const arg of cmd.arguments) {
          const argStr = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
          command.argument(argStr, arg.description, arg.defaultValue);
        }
      }

      // Set action
      command.action(async (...actionArgs) => {
        const opts = command.opts();
        const args: Record<string, unknown> = {};
        
        if (cmd.arguments) {
          cmd.arguments.forEach((arg, index) => {
            args[arg.name] = actionArgs[index];
          });
        }

        const context = new CommanderContext(opts, args);
        const result = await cmd.execute(context);

        if (result.message) {
          if (result.exitCode === 0) {
            console.log(result.message);
          } else {
            console.error(result.message);
          }
        }

        if (result.exitCode !== 0) {
          process.exit(result.exitCode);
        }
      });
    }
  }

  async run(argv: string[]): Promise<void> {
    await this.program.parseAsync(argv);
  }
}

export { CLI_COMMAND };
