import { createContainer } from './container.js';
import { TYPES } from './Domain/types.js';
import type { CliRunner } from './Ui/Cli/CliRunner.js';

async function main() {
  const container = createContainer();
  const cliRunner = container.get<CliRunner>(TYPES.CliRunner);
  await cliRunner.run(process.argv);
}

main().catch((error) => {
  console.error('CLI Error:', error);
  process.exit(1);
});
