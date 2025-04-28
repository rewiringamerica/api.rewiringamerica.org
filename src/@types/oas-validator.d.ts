declare module 'oas-validator' {
  export type InputOptions = {
    // The library supports many more options than this, but this is the only
    // one of interest to us
    lint?: boolean;
  };
  export type OutputOptions = {
    // These are the only outputs we use
    valid: boolean;
    context: string[];
  };

  export function validate(
    oas: unknown,
    options: InputOptions,
  ): Promise<InputOptions & OutputOptions>;

  export type Error = {
    message: string;
    options: InputOptions & OutputOptions;
  };
}
