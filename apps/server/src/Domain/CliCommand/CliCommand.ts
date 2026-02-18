import type { CliContext } from './CliContext.js';
import type { CliResult } from './CliResult.js';
import type { CliOption } from './CliOption.js';
import type { CliArgument } from './CliArgument.js';

export interface CliCommand {
  readonly name: string;
  readonly description: string;
  readonly options?: CliOption[];
  readonly arguments?: CliArgument[];
  
  execute(context: CliContext): Promise<CliResult>;
}
