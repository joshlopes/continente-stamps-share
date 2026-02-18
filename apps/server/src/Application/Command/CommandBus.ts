import { inject, injectable } from 'inversify';
import type { Command } from '../../Domain/Command/Command.js';
import { TYPES } from '../../Domain/types.js';
import type { CommandHandlerManager } from './CommandHandlerManager.js';

@injectable()
export class CommandBus {
  constructor(
    @inject(TYPES.CommandHandlerManager)
    private readonly handlerManager: CommandHandlerManager
  ) {}

  async dispatch<TCommand extends Command, TResult>(
    command: TCommand
  ): Promise<TResult> {
    const handler = this.handlerManager.getHandler<TCommand, TResult>(
      command.commandName
    );

    if (!handler) {
      throw new Error(`No handler registered for command: ${command.commandName}`);
    }

    return handler.handle(command);
  }
}
