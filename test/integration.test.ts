import { describe, it, expect } from 'vitest';
import { parseAssembly } from '../src/services/assembly-parser.service/assembly-parser.service';
import { parseInstructions } from '../src/services/instruction.parser.service'
import { encodeInstruction, decodeInstruction } from '../src/services/handler.registry.service';
import { regNameToBits } from '../src/utils/register.utils'
import { constToBits } from '../src/utils/bit.utils';
import { formatDecodedInstruction } from '../src/utils/format.utils';

const assembleToHexes = (program: string, version: 'r6' = 'r6') => {
    const { instructions, errors } = parseAssembly(program);

    expect(errors).toHaveLength(0);
    expect(instructions.length).toBeGreaterThan(0);

    const decoded = parseInstructions(instructions);
    return decoded.map(instruction => encodeInstruction(instruction, version));
};

describe('flujo completo assembly → hex → assembly', () => {
    it('formatDecodedInstruction', () => {
        const result = decodeInstruction('0x012A4020', 'r6');
        expect(formatDecodedInstruction(result)).toBe('add $t0 $t1 $t2');
    });

    it('round-trip completo', () => {
        const inputs = [
            'add $t0, $t1, $t2',
            'lw $s0, 4($sp)',
            'addiu $t1, $zero, 42',
        ];

        for (const input of inputs) {
            const { instructions } = parseAssembly(input);
            const decoded          = parseInstructions(instructions);
            const hex              = encodeInstruction(decoded[0], 'r6');
            const back             = decodeInstruction(hex, 'r6');
            const formatted        = formatDecodedInstruction(back);

            console.log(`${input.padEnd(25)} → ${hex} → ${formatted}`);
            expect(formatted).toContain(decoded[0].mnemonic);
        }
    });

    it('debug decode add', () => {
        const result = decodeInstruction('0x012A4020', 'r6');
        console.log(JSON.stringify(result, null, 2));
    });

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

    it('jump calcula dirección absoluta y encodea', () => {
        const program = `
        addiu $t0, $zero, 1
        j target
        addiu $t0, $zero, 2
        target: addiu $t0, $zero, 3
    `;

        const { instructions, errors } = parseAssembly(program);

        expect(errors).toHaveLength(0);
        expect(instructions).toHaveLength(4);

        expect(instructions).toEqual([
            'addiu $t0 $zero 1',
            'j 1048579',
            'addiu $t0 $zero 2',
            'addiu $t0 $zero 3',
        ]);

        const decoded = parseInstructions(instructions);
        const hexes = decoded.map(d => encodeInstruction(d, 'r6'));

        expect(hexes[1]).toBe('0x08100003');

        const decodedBack = decodeInstruction(hexes[1], 'r6');
        expect(decodedBack).toEqual({
            mnemonic: 'j',
            operands: [
                { kind: 'immediate', value: 1048579 }
            ]
        });
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

    it('programa complejo recursivo de Fibonacci (MIPS standard)', () => {
        const program = `
            # Fibonacci recursivo en MIPS
            main:   addiu $sp, $sp, -32
                    sw    $ra, 20($sp)
                    sw    $fp, 16($sp)
                    addiu $fp, $sp, 28
                    addiu $a0, $zero, 5
                    jal   fib
                    lw    $fp, 16($sp)
                    lw    $ra, 20($sp)
                    addiu $sp, $sp, 32
                    j     end
            fib:    addiu $sp, $sp, -16
                    sw    $ra, 12($sp)
                    sw    $s0, 8($sp)
                    addiu $s0, $a0, 0
                    slti  $t0, $s0, 2
                    beq   $t0, $zero, recurse
                    addiu $v0, $s0, 0
                    j     fib_ret
            recurse: addiu $a0, $s0, -1
                    jal   fib
                    sw    $v0, 4($sp)
                    addiu $a0, $s0, -2
                    jal   fib
                    lw    $t1, 4($sp)
                    addu  $v0, $v0, $t1
            fib_ret: lw    $s0, 8($sp)
                    lw    $ra, 12($sp)
                    addiu $sp, $sp, 16
                    jr    $ra
            end:    syscall
        `;

        const { instructions, errors } = parseAssembly(program);
        expect(errors).toHaveLength(0);
        expect(instructions).toHaveLength(30);

        // jal fib (index 5) -> fib está en index 10 (dirección 0x00400028 -> target = 1048586)
        expect(instructions[5]).toBe('jal 1048586');

        // j end (index 9) -> end está en index 29 (dirección 0x00400074 -> target = 1048605)
        expect(instructions[9]).toBe('j 1048605');

        // beq $t0, $zero, recurse (index 15) -> recurse en index 18. Offset = (18 - (15 + 1)) = 2
        expect(instructions[15]).toBe('beq $t0 $zero 2');

        // j fib_ret (index 17) -> fib_ret en index 25 (dirección 0x00400064 -> target = 1048601)
        expect(instructions[17]).toBe('j 1048601');

        const decoded = parseInstructions(instructions);
        const hexes = decoded.map(d => encodeInstruction(d, 'r6'));

        // jr $ra: 0x03E00008
        expect(hexes[28]).toBe('0x03E00008');

        // syscall: 0x0000000C
        expect(hexes[29]).toBe('0x0000000C');

        // lw $ra, 12($sp): 0x8FBF000C
        expect(hexes[26]).toBe('0x8FBF000C');

        // Decodificación y Round-trip completo
        const back = decoded.map((d, index) => decodeInstruction(hexes[index]!, 'r6'));
        for (let i = 0; i < decoded.length; i++) {
            expect(back[i]!.mnemonic).toBe(decoded[i]!.mnemonic);
            expect(back[i]!.operands.length).toBe(decoded[i]!.operands.length);
        }
    });
});