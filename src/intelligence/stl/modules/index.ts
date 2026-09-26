import { StlHeaderModule } from '../types';
import { memoryModule } from './memory';
import { containersModule } from './containers';
import { algorithmsModule } from './algorithms';
import { iteratorsModule } from './iterators';
import { rangesModule } from './ranges';
import { utilityModule } from './utility';
import { ioModule } from './io';
import { concurrencyModule } from './concurrency';
import { filesystemModule } from './filesystem';
import { chronoModule } from './chrono';
import { coroutinesModule } from './coroutines';
import { conceptsModule } from './concepts';
import { typeTraitsModule } from './type_traits';
import { numericModule } from './numeric';
import { bitModule } from './bit';
import { randomModule } from './random';
import { CSTD_MODULES } from './cstd';

export const BUILTIN_STL_MODULES: StlHeaderModule[] = [
  memoryModule,
  containersModule,
  algorithmsModule,
  iteratorsModule,
  rangesModule,
  utilityModule,
  ioModule,
  concurrencyModule,
  filesystemModule,
  chronoModule,
  coroutinesModule,
  conceptsModule,
  typeTraitsModule,
  numericModule,
  bitModule,
  randomModule,
  ...CSTD_MODULES
];

export * from './memory';
export * from './containers';
export * from './algorithms';
export * from './iterators';
export * from './ranges';
export * from './utility';
export * from './io';
export * from './concurrency';
export * from './filesystem';
export * from './chrono';
export * from './coroutines';
export * from './concepts';
export * from './type_traits';
export * from './numeric';
export * from './bit';
export * from './random';
export * from './cstd';
