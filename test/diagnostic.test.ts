// test/diagnostics/encodings.diagnostic.test.ts

import { describe, it } from 'vitest';
import { R6_INSTRUCTIONS_ENCODING, LEGACY_INSTRUCTIONS_ENCODING } from '../src/constants/instructions.constants';

describe('R6 encodings', () => {
    it('imprime todos los encodings', () => {
        console.table(LEGACY_INSTRUCTIONS_ENCODING.map(e => ({
            mnemonic: e.mnemonic,
            type: e.type,
            opcode: e.opcode,
            funct: e.funct ?? '-',
            shamt: e.shamt ?? '-',
            version: e.version,
        })));
    });
});