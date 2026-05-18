import { describe, it, expect } from 'vitest';
import { parseAssembly } from '../src/services/assembly-parser.service/assembly-parser.service';
import { parseInstructions } from '../src/services/instruction.parser.service'
import { encodeInstruction, decodeInstruction } from '../src/services/handler.registry.service';
import { regNameToBits } from '../src/utils/register.utils'
import { constToBits } from '../src/utils/bit.utils';

const assembleToHexes = (program: string, version: 'r6' = 'r6') => {
    const { instructions, errors } = parseAssembly(program);

    expect(errors).toHaveLength(0);
    expect(instructions.length).toBeGreaterThan(0);

    const decoded = parseInstructions(instructions);
    return decoded.map(instruction => encodeInstruction(instruction, version));
};

describe('flujo completo assembly → hex → assembly', () => {
    it('debug lw bits', () => {
        const rt = regNameToBits('s0');
        const rs = regNameToBits('sp');
        const offset = constToBits(4, 16);

        console.log('rt (s0):', rt);
        console.log('rs (sp):', rs);
        console.log('offset:', offset);
        console.log('bits32:', '100011' + rs + rt + offset);

        expect(rt).toBe('10000');
        expect(rs).toBe('11101');
        expect(offset).toBe('0000000000000100');
        expect('100011' + rs + rt + offset).toBe(
            '10001111101100000000000000000100',
        );
    });

    it('lw $s0, 4($sp) encodea correctamente', () => {
        const hexes = assembleToHexes(`
        lw $s0, 4($sp)
    `);

        expect(hexes).toEqual([
            '0x8FB00004',
        ]);
    });

    it('sw $s0, 8($sp) encodea correctamente', () => {
        const hexes = assembleToHexes(`
        sw $s0, 8($sp)
    `);

        expect(hexes).toEqual([
            '0xAFB00008',
        ]);
    });

    it('programa completo con loop y branch hacia atrás', () => {
        const program = `
        addiu $t0, $zero, 10
        addiu $t1, $zero, 0
        loop: add $t1, $t1, $t0
              addiu $t0, $t0, -1
              bne $t0, $zero, loop
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(errors).toHaveLength(0);
        expect(instructions).toHaveLength(5);

        expect(instructions).toEqual([
            'addiu $t0 $zero 10',
            'addiu $t1 $zero 0',
            'add $t1 $t1 $t0',
            'addiu $t0 $t0 -1',
            'bne $t0 $zero -3',
        ]);

        const decoded = parseInstructions(instructions);
        const hexes = decoded.map(d => encodeInstruction(d, 'r6'));

        expect(hexes).toEqual([
            '0x2408000A',
            '0x24090000',
            '0x01284820',
            '0x2508FFFF',
            '0x1500FFFD',
        ]);
    });

    it('branch hacia adelante calcula offset positivo', () => {
        const program = `
        beq $t0, $zero, end
        addiu $t1, $zero, 1
        end: addiu $t2, $zero, 2
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(errors).toHaveLength(0);
        expect(instructions).toHaveLength(3);

        expect(instructions).toEqual([
            'beq $t0 $zero 1',
            'addiu $t1 $zero 1',
            'addiu $t2 $zero 2',
        ]);

        const decoded = parseInstructions(instructions);
        const hexes = decoded.map(d => encodeInstruction(d, 'r6'));

        expect(hexes).toEqual([
            '0x11000001',
            '0x24090001',
            '0x240A0002',
        ]);
    });

    it('branch hacia la siguiente instrucción usa offset 0', () => {
        const program = `
        beq $t0, $zero, next
        next: addiu $t1, $zero, 1
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(errors).toHaveLength(0);

        expect(instructions).toEqual([
            'beq $t0 $zero 0',
            'addiu $t1 $zero 1',
        ]);

        const decoded = parseInstructions(instructions);
        const hexes = decoded.map(d => encodeInstruction(d, 'r6'));

        expect(hexes).toEqual([
            '0x11000000',
            '0x24090001',
        ]);
    });

    it('detecta etiqueta duplicada', () => {
        const program = `
        loop: addiu $t0, $zero, 1
        loop: addiu $t1, $zero, 2
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(instructions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('Etiqueta duplicada');
    });

    it('detecta etiqueta no definida', () => {
        const program = `
        beq $t0, $zero, missing_label
        addiu $t1, $zero, 1
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(instructions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('etiqueta no definida');
    });

    it('detecta instrucción desconocida', () => {
        const program = `
        fakeop $t0, $t1, $t2
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(instructions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('Instrucción desconocida');
    });

    it('ignora comentarios, líneas vacías y directivas', () => {
        const program = `
        # comentario inicial
        .text

        addiu $t0, $zero, 5   # comentario inline

        .data
        addiu $t1, $zero, 7
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(errors).toHaveLength(0);
        expect(instructions).toEqual([
            'addiu $t0 $zero 5',
            'addiu $t1 $zero 7',
        ]);

        const decoded = parseInstructions(instructions);
        const hexes = decoded.map(d => encodeInstruction(d, 'r6'));

        expect(hexes).toEqual([
            '0x24080005',
            '0x24090007',
        ]);
    });

    it('round trip add: assembly → hex → decoded', () => {
        const hexes = assembleToHexes(`
        add $t0, $t1, $t2
    `);

        expect(hexes).toEqual([
            '0x012A4020',
        ]);

        const decodedBack = decodeInstruction(hexes[0], 'r6');

        expect(decodedBack).toEqual({
            mnemonic: 'add',
            operands: [
                { kind: 'register', name: 't0' },
                { kind: 'register', name: 't1' },
                { kind: 'register', name: 't2' },
            ],
        });
    });

    it('round trip memoria: lw encode/decode', () => {
        const hexes = assembleToHexes(`
        lw $s0, 4($sp)
    `);

        expect(hexes).toEqual([
            '0x8FB00004',
        ]);

        const decodedBack = decodeInstruction(hexes[0], 'r6');

        expect(decodedBack).toEqual({
            mnemonic: 'lw',
            operands: [
                { kind: 'register', name: 's0' },
                { kind: 'memory', base: 'sp', offset: 4 },
            ],
        });
    });

    it('offset negativo en memoria se conserva', () => {
        const hexes = assembleToHexes(`
        lw $s0, -4($sp)
    `);

        expect(hexes).toEqual([
            '0x8FB0FFFC',
        ]);

        const decodedBack = decodeInstruction(hexes[0], 'r6');

        expect(decodedBack).toEqual({
            mnemonic: 'lw',
            operands: [
                { kind: 'register', name: 's0' },
                { kind: 'memory', base: 'sp', offset: -4 },
            ],
        });
    });

    it('valida cantidad incorrecta de operandos', () => {
        const program = `
        add $t0, $t1
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(instructions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('espera');
        expect(errors[0]).toContain('operandos');
    });

    it('valida registro inválido', () => {
        const program = `
        add $fake, $t1, $t2
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(instructions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('registro');
    });

    it('valida inmediato fuera de rango', () => {
        const program = `
        addiu $t0, $zero, 999999
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(instructions).toHaveLength(0);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('fuera de rango');
    });
});