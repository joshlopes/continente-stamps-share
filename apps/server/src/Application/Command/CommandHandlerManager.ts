import { injectable } from 'inversify';
import type { Command } from '../../Domain/Command/Command.js';
import type { CommandHandler } from './CommandHandler.js';

@injectable()
export class CommandHandlerManager {
  private handlers = new Map<string, CommandHandler<Command, unknown>>();

  register<TCommand extends Command, TResult>(
    commandName: string,
    handler: CommandHandler<TCommand, TResult>
  ): void {
    this.handlers.set(commandName, handler as CommandHandler<Command, unknown>);
  }

  getHandler<TCommand extends Command, TResult>(
    commandName: string
  ): CommandHandler<TCommand, TResult> | undefined {
    return this.handlers.get(commandName) as CommandHandler<TCommand, TResult> | undefined;
  }

  hasHandler(commandName: string): boolean {
    return this.handlers.has(commandName);
  }
}
