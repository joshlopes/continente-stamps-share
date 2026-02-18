export interface CliOption {
  readonly name: string;
  readonly short?: string;
  readonly description: string;
  readonly required?: boolean;
  readonly defaultValue?: string;
}
