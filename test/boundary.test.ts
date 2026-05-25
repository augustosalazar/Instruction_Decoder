// test/boundary.test.ts
// Pruebas de casos límite (boundary testing):
// Verifica el comportamiento del sistema en los valores extremos
// de cada tipo de operando — los casos que más frecuentemente rompen sistemas reales.

import { describe, it, expect } from 'vitest';
import { parseAssembly }        from '../src/services/assembly-parser.service/assembly-parser.service';
import { parseInstructions }    from '../src/services/instruction.parser.service';
import { encodeInstruction, decodeInstruction } from '../src/services/handler.registry.service';

// ─── Helper ──────────────────────────────────────────────────────────────────

const parse = (program: string) => parseAssembly(program);

const encode = (program: string) => {
    const { instructions, errors } = parse(program);
    if (errors.length > 0) return { hexes: [], errors };
    const decoded = parseInstructions(instructions);
    const hexes   = decoded.map(i => encodeInstruction(i, 'r6'));
    return { hexes, errors };
};

// ─── 1. LÍMITES DE INMEDIATOS SIGNED 16-BIT (-32768 a 32767) ─────────────────
// Usado por: addiu, addi, slti, sltiu, ori, andi, xori

describe('Boundary – inmediatos signed 16-bit', () => {

    it('acepta el valor máximo permitido: 32767', () => {
        const { errors, hexes } = encode('addiu $t0, $zero, 32767');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
    });

    it('acepta el valor mínimo permitido: -32768', () => {
        const { errors, hexes } = encode('addiu $t0, $zero, -32768');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
    });

    it('acepta el valor cero', () => {
        const { errors, hexes } = encode('addiu $t0, $zero, 0');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
    });

    it('acepta el valor 1 (límite positivo mínimo)', () => {
        const { errors, hexes } = encode('addiu $t0, $zero, 1');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
    });

    it('acepta el valor -1 (límite negativo máximo)', () => {
        const { errors, hexes } = encode('addiu $t0, $zero, -1');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
    });

    it('rechaza 32768 (un paso sobre el máximo)', () => {
        const { errors } = encode('addiu $t0, $zero, 32768');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('fuera de rango');
    });

    it('rechaza -32769 (un paso bajo el mínimo)', () => {
        const { errors } = encode('addiu $t0, $zero, -32769');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('fuera de rango');
    });

    it('rechaza 999999 (muy por encima del rango)', () => {
        const { errors } = encode('addiu $t0, $zero, 999999');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('el hex de 32767 tiene los 16 bits bajos en 0x7FFF', () => {
        const { hexes } = encode('addiu $t0, $zero, 32767');
        expect(hexes[0]).toMatch(/7FFF$/);
    });

    it('el hex de -32768 tiene los 16 bits bajos en 0x8000', () => {
        const { hexes } = encode('addiu $t0, $zero, -32768');
        expect(hexes[0]).toMatch(/8000$/);
    });

    it('round-trip preserva 32767 al decodificar', () => {
        const { hexes } = encode('addiu $t0, $zero, 32767');
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.operands[2]).toEqual({ kind: 'immediate', value: 32767 });
    });

    it('round-trip preserva -32768 al decodificar', () => {
        const { hexes } = encode('addiu $t0, $zero, -32768');
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.operands[2]).toEqual({ kind: 'immediate', value: -32768 });
    });

});

// ─── 2. LÍMITES DE OFFSET DE MEMORIA (-32768 a 32767) ────────────────────────
// Usado por: lw, sw, lb, sb, lh, sh, lbu, lhu

describe('Boundary – offset de memoria', () => {

    it('acepta offset máximo: 32767', () => {
        const { errors } = encode('lw $t0, 32767($sp)');
        expect(errors).toHaveLength(0);
    });

    it('acepta offset mínimo: -32768', () => {
        const { errors } = encode('lw $t0, -32768($sp)');
        expect(errors).toHaveLength(0);
    });

    it('acepta offset cero', () => {
        const { errors } = encode('lw $t0, 0($sp)');
        expect(errors).toHaveLength(0);
    });

    it('rechaza offset 32768 (uno sobre el máximo)', () => {
        const { errors } = encode('lw $t0, 32768($sp)');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rechaza offset -32769 (uno bajo el mínimo)', () => {
        const { errors } = encode('lw $t0, -32769($sp)');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('round-trip preserva offset 32767 en lw', () => {
        const { hexes, errors } = encode('lw $t0, 32767($sp)');
        expect(errors).toHaveLength(0);
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.operands[1]).toEqual({ kind: 'memory', base: 'sp', offset: 32767 });
    });

    it('round-trip preserva offset -32768 en lw', () => {
        const { hexes, errors } = encode('lw $t0, -32768($sp)');
        expect(errors).toHaveLength(0);
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.operands[1]).toEqual({ kind: 'memory', base: 'sp', offset: -32768 });
    });

    it('sw con offset 0 codifica correctamente', () => {
        const { hexes, errors } = encode('sw $t0, 0($sp)');
        expect(errors).toHaveLength(0);
        expect(hexes[0]).toMatch(/0000$/);
    });

});

// ─── 3. LÍMITES DE SHAMT (0 a 31) ────────────────────────────────────────────
// Usado por: sll, srl, sra

describe('Boundary – shamt (shift amount)', () => {

    it('acepta shamt 0 (mínimo)', () => {
        const { errors } = encode('sll $t0, $t1, 0');
        expect(errors).toHaveLength(0);
    });

    it('acepta shamt 31 (máximo)', () => {
        const { errors } = encode('sll $t0, $t1, 31');
        expect(errors).toHaveLength(0);
    });

    it('acepta shamt 1', () => {
        const { errors } = encode('sll $t0, $t1, 1');
        expect(errors).toHaveLength(0);
    });

    it('acepta shamt 16 (valor central)', () => {
        const { errors } = encode('sll $t0, $t1, 16');
        expect(errors).toHaveLength(0);
    });

    it('rechaza shamt 32 (uno sobre el máximo)', () => {
        const { errors } = encode('sll $t0, $t1, 32');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('rechaza shamt negativo', () => {
        const { errors } = encode('sll $t0, $t1, -1');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('round-trip preserva shamt 31 en sll', () => {
        const { hexes, errors } = encode('sll $t0, $t1, 31');
        expect(errors).toHaveLength(0);
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.mnemonic).toBe('sll');
        expect(back.operands[2]).toEqual({ kind: 'immediate', value: 31 });
    });

});

// ─── 4. REGISTROS ESPECIALES ──────────────────────────────────────────────────
// $zero siempre es 0, $sp, $ra y $fp tienen roles específicos

describe('Boundary – registros especiales', () => {

    it('$zero como destino es aceptado por el parser', () => {
        const { errors } = encode('addiu $zero, $zero, 0');
        expect(errors).toHaveLength(0);
    });

    it('$zero como fuente produce el valor 0 en el hex', () => {
        const { hexes, errors } = encode('addiu $t0, $zero, 5');
        expect(errors).toHaveLength(0);
        // rs = $zero = 00000, debe estar en bits 6-10
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.operands[1]).toEqual({ kind: 'register', name: 'zero' });
    });

    it('$sp es aceptado como base de memoria', () => {
        const { errors } = encode('lw $t0, 4($sp)');
        expect(errors).toHaveLength(0);
    });

    it('$ra es aceptado como registro en jr', () => {
        const { errors } = encode('jr $ra');
        expect(errors).toHaveLength(0);
    });

    it('$fp es aceptado como registro general', () => {
        const { errors } = encode('addiu $fp, $sp, 28');
        expect(errors).toHaveLength(0);
    });

    it('registro inexistente $xyz es rechazado', () => {
        const { errors } = encode('addiu $t0, $xyz, 1');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('registro inexistente $t10 es rechazado (solo van hasta $t9)', () => {
        const { errors } = encode('addiu $t0, $t10, 1');
        expect(errors.length).toBeGreaterThan(0);
    });

    it('round-trip preserva $ra en jr', () => {
        const { hexes, errors } = encode('jr $ra');
        expect(errors).toHaveLength(0);
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.mnemonic).toBe('jr');
        expect(back.operands[0]).toEqual({ kind: 'register', name: 'ra' });
    });

});

// ─── 5. VALORES HEXADECIMALES COMO INMEDIATOS ─────────────────────────────────

describe('Boundary – inmediatos en formato hexadecimal', () => {

    it('acepta inmediato en hex: 0xFF', () => {
        const { errors } = encode('addiu $t0, $zero, 0xFF');
        expect(errors).toHaveLength(0);
    });

    it('acepta inmediato en hex: 0x7FFF (máximo signed)', () => {
        const { errors } = encode('addiu $t0, $zero, 0x7FFF');
        expect(errors).toHaveLength(0);
    });

    it('0xFF produce el mismo hex que 255 en decimal', () => {
        const hex    = encode('addiu $t0, $zero, 0xFF').hexes[0];
        const dec    = encode('addiu $t0, $zero, 255').hexes[0];
        expect(hex).toBe(dec);
    });

    it('rechaza 0x8000 como signed 16-bit (valor 32768, fuera de rango)', () => {
        const { errors } = encode('addiu $t0, $zero, 0x8000');
        expect(errors.length).toBeGreaterThan(0);
    });

});
