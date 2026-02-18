export interface CliArgument {
  readonly name: string;
  readonly description: string;
  readonly required?: boolean;
  readonly defaultValue?: string;
}
