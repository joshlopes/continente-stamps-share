import type { Command } from '../../Domain/Command/Command.js';

export interface CommandHandler<TCommand extends Command, TResult = void> {
  handle(command: TCommand): Promise<TResult>;
}
