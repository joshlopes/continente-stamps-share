export interface CliContext {
  getOption<T = string>(name: string): T | undefined;
  getArgument<T = string>(name: string): T | undefined;
  hasOption(name: string): boolean;
  hasArgument(name: string): boolean;
}
