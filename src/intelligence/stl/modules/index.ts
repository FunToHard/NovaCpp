import { StlHeaderModule } from '../types';
import { memoryModule } from './memory';
import { containersModule } from './containers';
import { algorithmsModule } from './algorithms';
import { utilityModule } from './utility';
import { ioModule } from './io';
import { concurrencyModule } from './concurrency';
import { filesystemModule } from './filesystem';
import { chronoModule } from './chrono';
import { CSTD_MODULES } from './cstd';

export const BUILTIN_STL_MODULES: StlHeaderModule[] = [
  memoryModule,
  containersModule,
  algorithmsModule,
  utilityModule,
  ioModule,
  concurrencyModule,
  filesystemModule,
  chronoModule,
  ...CSTD_MODULES
];

export * from './memory';
export * from './containers';
export * from './algorithms';
export * from './utility';
export * from './io';
export * from './concurrency';
export * from './filesystem';
export * from './chrono';
export * from './cstd';
