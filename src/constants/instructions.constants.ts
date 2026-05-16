/* 
    instructions.constants usan los JSON de data/ como
    source of truth. Este file resume el casteo
*/

import legacyRaw from '@/data/mips-instructions.json';
import r6Raw     from '@/data/mips-r6-instructions.json';

import type { InstructionEncoding } from '@/types/instruction.types';

/* 
    TODO: TypeGuard para validar que los datos raw se parseen bien. 
*/

export const LEGACY_INSTRUCTIONS_ENCODING = legacyRaw as ReadonlyArray<InstructionEncoding>;
export const R6_INSTRUCTIONS_ENCODING     = r6Raw     as ReadonlyArray<InstructionEncoding>;