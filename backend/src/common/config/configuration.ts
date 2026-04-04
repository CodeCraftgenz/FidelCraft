import { validateEnv } from './env.config';
import type { EnvConfig } from './env.config';

export default (): EnvConfig => {
  return validateEnv(process.env);
};
