import { describe, it, expect } from 'vitest';
import { encodeInstruction, decodeInstruction } from '../src/services/handler.registry.service';

describe('Registry - encode', () => {

    it('add $t0, $t1, $t2', () => {
        const result = encodeInstruction({
            mnemonic: 'add',
            operands: [
                { kind: 'register', name: 't0' },
                { kind: 'register', name: 't1' },
                { kind: 'register', name: 't2' },
            ],
        }, 'r6');
        expect(result).toBe('0x012A4020');
    });

    it('lw $t0, 4($sp)', () => {
        const result = encodeInstruction({
            mnemonic: 'lw',
            operands: [
                { kind: 'register', name: 't0' },
                { kind: 'memory', base: 'sp', offset: 4 },
            ],
        }, 'r6');
        expect(result).toBe('0x8FA80004');
    });

    it('addiu $t0, $zero, 42', () => {
        const result = encodeInstruction({
            mnemonic: 'addiu',
            operands: [
                { kind: 'register', name: 't0' },
                { kind: 'register', name: 'zero' },
                { kind: 'immediate', value: 42 },
            ],
        }, 'r6');
        expect(result).toBe('0x2408002A');
    });

    it('j 0x10004', () => {
        const result = encodeInstruction({
            mnemonic: 'j',
            operands: [
                { kind: 'immediate', value: 0x10004 },
            ],
        }, 'r6');
        expect(result).toBe('0x08010004');
    });

    it('jal 0x3FFF0', () => {
        const result = encodeInstruction({
            mnemonic: 'jal',
            operands: [
                { kind: 'immediate', value: 0x3FFF0 },
            ],
        }, 'r6');
        expect(result).toBe('0x0C03FFF0');
    });

    it('lanza error para mnemonic desconocido', () => {
        expect(() => encodeInstruction({
            mnemonic: 'foo' as any,
            operands: [],
        }, 'r6')).toThrow();
    });

});

describe('Registry - decode', () => {

    it('0x012A4020 → add $t0 $t1 $t2', () => {
        const result = decodeInstruction('0x012A4020', 'r6');
        expect(result.mnemonic).toBe('add');
        expect(result.operands[0]).toEqual({ kind: 'register', name: 't0' });
        expect(result.operands[1]).toEqual({ kind: 'register', name: 't1' });
        expect(result.operands[2]).toEqual({ kind: 'register', name: 't2' });
    });

    it('0x08010004 → j 0x10004', () => {
        const result = decodeInstruction('0x08010004', 'r6');
        expect(result.mnemonic).toBe('j');
        expect(result.operands[0]).toEqual({ kind: 'immediate', value: 0x10004 });
    });

    it('0x0C03FFF0 → jal 0x3FFF0', () => {
        const result = decodeInstruction('0x0C03FFF0', 'r6');
        expect(result.mnemonic).toBe('jal');
        expect(result.operands[0]).toEqual({ kind: 'immediate', value: 0x3FFF0 });
    });

    it('decode(encode(x)) === x (round-trip)', () => {
        const original: import('../src/types/instruction.types').DecodedInstruction = {
            mnemonic: 'add',
            operands: [
                { kind: 'register', name: 't0' },
                { kind: 'register', name: 't1' },
                { kind: 'register', name: 't2' },
            ],
        };
        const hex = encodeInstruction(original, 'r6');
        const result = decodeInstruction(hex, 'r6');
        expect(result).toEqual(original);
    });

    it('decode(encode(j)) === j (round-trip)', () => {
        const original: import('../src/types/instruction.types').DecodedInstruction = {
            mnemonic: 'jal',
            operands: [
                { kind: 'immediate', value: 0x1F2A3B },
            ],
        };
        const hex = encodeInstruction(original, 'r6');
        const result = decodeInstruction(hex, 'r6');
        expect(result).toEqual(original);
    });

});