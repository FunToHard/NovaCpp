import { StlHeaderModule } from '../../types';
import { cmathModule } from './cmath';
import { cstdioModule } from './cstdio';
import { cstdlibModule } from './cstdlib';
import { cstringModule } from './cstring';
import { cctypeModule } from './cctype';
import { ctimeModule } from './ctime';
import { cstdintModule } from './cstdint';

export const CSTD_MODULES: StlHeaderModule[] = [
  cmathModule,
  cstdioModule,
  cstdlibModule,
  cstringModule,
  cctypeModule,
  ctimeModule,
  cstdintModule
];

export * from './cmath';
export * from './cstdio';
export * from './cstdlib';
export * from './cstring';
export * from './cctype';
export * from './ctime';
export * from './cstdint';
