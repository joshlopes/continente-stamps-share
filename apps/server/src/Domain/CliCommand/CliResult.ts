export interface CliResult {
  readonly exitCode: number;
  readonly message?: string;
}

export const CliResult = {
  success(message?: string): CliResult {
    return { exitCode: 0, message };
  },
  
  failure(message: string, exitCode = 1): CliResult {
    return { exitCode, message };
  },
};
