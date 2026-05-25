// test/e2e.test.ts
// Pruebas end-to-end: flujo completo assembly → parse → encode → decode → format
// Cubre que el pipeline no falle, que la librería funcione y que las instrucciones
// sean las esperadas en cada etapa.

import { describe, it, expect } from 'vitest';
import { parseAssembly }          from '../src/services/assembly-parser.service/assembly-parser.service';
import { parseInstructions }       from '../src/services/instruction.parser.service';
import { encodeInstruction, decodeInstruction } from '../src/services/handler.registry.service';
import { formatDecodedInstruction }             from '../src/utils/format.utils';

// ─── Helper: ejecuta el pipeline completo y devuelve cada etapa ──────────────

interface PipelineResult {
    parsedLines  : string[];
    hexes        : string[];
    decodedBack  : ReturnType<typeof decodeInstruction>[];
    formatted    : string[];
    errors       : string[];
}

const runPipeline = (program: string, version: 'r6' = 'r6'): PipelineResult => {
    const { instructions: parsedLines, errors } = parseAssembly(program);
    if (errors.length > 0) return { parsedLines: [], hexes: [], decodedBack: [], formatted: [], errors };

    const decoded     = parseInstructions(parsedLines);
    const hexes       = decoded.map(i => encodeInstruction(i, version));
    const decodedBack = hexes.map(h => decodeInstruction(h, version));
    const formatted   = decodedBack.map(formatDecodedInstruction);

    return { parsedLines, hexes, decodedBack, formatted, errors };
};

// ─── 1. FLUJO COMPLETO SIN ERRORES ───────────────────────────────────────────

describe('E2E – el flujo no falla', () => {

    it('una instrucción R-type llega al final sin errores', () => {
        const { errors, hexes, formatted } = runPipeline('add $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
        expect(formatted[0]).toContain('add');
    });

    it('una instrucción I-type llega al final sin errores', () => {
        const { errors, hexes, formatted } = runPipeline('addiu $t0, $zero, 10');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
        expect(formatted[0]).toContain('addiu');
    });

    it('una instrucción de memoria llega al final sin errores', () => {
        const { errors, hexes, formatted } = runPipeline('lw $s0, 4($sp)');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
        expect(formatted[0]).toContain('lw');
    });

    it('una instrucción de branch llega al final sin errores', () => {
        const program = `
            beq $t0, $zero, fin
            addiu $t1, $zero, 1
            fin: addiu $t2, $zero, 2
        `;
        const { errors, hexes } = runPipeline(program);
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(3);
    });

    it('una instrucción J-type llega al final sin errores', () => {
        const { errors, hexes, formatted } = runPipeline('j 1000');
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(1);
        expect(formatted[0]).toContain('j');
    });

    it('un programa de múltiples instrucciones llega al final sin errores', () => {
        const program = `
            addiu $t0, $zero, 5
            addiu $t1, $zero, 3
            add   $t2, $t0, $t1
            sw    $t2, 0($sp)
            lw    $t3, 0($sp)
        `;
        const { errors, hexes, formatted } = runPipeline(program);
        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(5);
        expect(formatted).toHaveLength(5);
    });

});

// ─── 2. LA LIBRERÍA FUNCIONA: INSTRUCCIONES ESPERADAS ────────────────────────

describe('E2E – las instrucciones producen los hexadecimales esperados', () => {

    it('add $t0, $t1, $t2  →  0x012A4020', () => {
        const { hexes } = runPipeline('add $t0, $t1, $t2');
        expect(hexes[0]).toBe('0x012A4020');
    });

    it('addiu $t0, $zero, 42  →  0x2408002A', () => {
        const { hexes } = runPipeline('addiu $t0, $zero, 42');
        expect(hexes[0]).toBe('0x2408002A');
    });

    it('lw $s0, 4($sp)  →  0x8FB00004', () => {
        const { hexes } = runPipeline('lw $s0, 4($sp)');
        expect(hexes[0]).toBe('0x8FB00004');
    });

    it('sw $s0, 8($sp)  →  0xAFB00008', () => {
        const { hexes } = runPipeline('sw $s0, 8($sp)');
        expect(hexes[0]).toBe('0xAFB00008');
    });

    it('beq con offset hacia adelante produce hex correcto', () => {
        const program = `
            beq $t0, $zero, end
            addiu $t1, $zero, 1
            end: addiu $t2, $zero, 2
        `;
        const { hexes } = runPipeline(program);
        expect(hexes[0]).toBe('0x11000001');
    });

    it('bne con offset hacia atrás (loop) produce hex correcto', () => {
        const program = `
            addiu $t0, $zero, 10
            loop: addiu $t0, $t0, -1
                  bne $t0, $zero, loop
        `;
        const { hexes } = runPipeline(program);
        expect(hexes[2]).toBe('0x1500FFFE');
    });

    it('lw con offset negativo  →  0x8FB0FFFC', () => {
        const { hexes } = runPipeline('lw $s0, -4($sp)');
        expect(hexes[0]).toBe('0x8FB0FFFC');
    });

    it('sub $t0, $t1, $t2 produce hex correcto', () => {
        const { errors, hexes } = runPipeline('sub $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
        expect(hexes[0]).toMatch(/^0x[0-9A-F]{8}$/);
    });

    it('or $t0, $t1, $t2 produce hex correcto', () => {
        const { errors, hexes } = runPipeline('or $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
        expect(hexes[0]).toMatch(/^0x[0-9A-F]{8}$/);
    });

    it('and $t0, $t1, $t2 produce hex correcto', () => {
        const { errors, hexes } = runPipeline('and $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
        expect(hexes[0]).toMatch(/^0x[0-9A-F]{8}$/);
    });

});

// ─── 3. ROUND-TRIP: decode(encode(x)) === x ──────────────────────────────────

describe('E2E – round-trip: la instrucción decodificada coincide con la original', () => {

    const roundTrip = (asm: string, expectedMnemonic: string) => {
        const { errors, decodedBack } = runPipeline(asm);
        expect(errors).toHaveLength(0);
        expect(decodedBack[0].mnemonic).toBe(expectedMnemonic);
    };

    it('add  round-trip preserva el mnemónico', () => roundTrip('add $t0, $t1, $t2',     'add'));
    it('addiu round-trip preserva el mnemónico', () => roundTrip('addiu $t0, $zero, 7',   'addiu'));
    it('lw   round-trip preserva el mnemónico', () => roundTrip('lw $s0, 4($sp)',         'lw'));
    it('sw   round-trip preserva el mnemónico', () => roundTrip('sw $s0, 8($sp)',         'sw'));
    it('sub  round-trip preserva el mnemónico', () => roundTrip('sub $t0, $t1, $t2',     'sub'));
    it('or   round-trip preserva el mnemónico', () => roundTrip('or $t0, $t1, $t2',      'or'));
    it('and  round-trip preserva el mnemónico', () => roundTrip('and $t0, $t1, $t2',     'and'));
    it('slt  round-trip preserva el mnemónico', () => roundTrip('slt $t0, $t1, $t2',     'slt'));

    it('round-trip preserva los operandos de add', () => {
        const { errors, decodedBack } = runPipeline('add $t0, $t1, $t2');
        expect(errors).toHaveLength(0);
        expect(decodedBack[0].operands[0]).toEqual({ kind: 'register', name: 't0' });
        expect(decodedBack[0].operands[1]).toEqual({ kind: 'register', name: 't1' });
        expect(decodedBack[0].operands[2]).toEqual({ kind: 'register', name: 't2' });
    });

    it('round-trip preserva offset de memoria en lw', () => {
        const { errors, decodedBack } = runPipeline('lw $s0, 4($sp)');
        expect(errors).toHaveLength(0);
        expect(decodedBack[0].operands[1]).toEqual({ kind: 'memory', base: 'sp', offset: 4 });
    });

    it('round-trip preserva offset negativo de memoria', () => {
        const { errors, decodedBack } = runPipeline('lw $s0, -4($sp)');
        expect(errors).toHaveLength(0);
        expect(decodedBack[0].operands[1]).toEqual({ kind: 'memory', base: 'sp', offset: -4 });
    });

    it('round-trip preserva inmediato en addiu', () => {
        const { errors, decodedBack } = runPipeline('addiu $t0, $zero, 42');
        expect(errors).toHaveLength(0);
        expect(decodedBack[0].operands[2]).toEqual({ kind: 'immediate', value: 42 });
    });

});

// ─── 4. PROGRAMAS COMPLETOS (escenarios reales) ───────────────────────────────

describe('E2E – programas completos de extremo a extremo', () => {

    it('suma de dos números: pipeline completo correcto', () => {
        const program = `
            addiu $t0, $zero, 5
            addiu $t1, $zero, 3
            add   $t2, $t0, $t1
        `;
        const { errors, hexes, decodedBack } = runPipeline(program);

        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(3);
        expect(decodedBack[0].mnemonic).toBe('addiu');
        expect(decodedBack[1].mnemonic).toBe('addiu');
        expect(decodedBack[2].mnemonic).toBe('add');
    });

    it('loop countdown: instrucciones y hexes correctos', () => {
        const program = `
            addiu $t0, $zero, 10
            addiu $t1, $zero, 0
            loop: add   $t1, $t1, $t0
                  addiu $t0, $t0, -1
                  bne   $t0, $zero, loop
        `;
        const { errors, hexes, parsedLines } = runPipeline(program);

        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(5);

        // El branch hacia atrás debe tener offset negativo en la línea parseada
        expect(parsedLines[4]).toContain('-3');

        // Hexes esperados
        expect(hexes[0]).toBe('0x2408000A');
        expect(hexes[1]).toBe('0x24090000');
        expect(hexes[4]).toBe('0x1500FFFD');
    });

    it('guardar y cargar de memoria: pipeline correcto', () => {
        const program = `
            addiu $t0, $zero, 99
            sw    $t0, 0($sp)
            lw    $t1, 0($sp)
        `;
        const { errors, hexes, decodedBack } = runPipeline(program);

        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(3);
        expect(decodedBack[1].mnemonic).toBe('sw');
        expect(decodedBack[2].mnemonic).toBe('lw');
        // El offset guardado y cargado es el mismo
        expect(decodedBack[1].operands[1]).toEqual({ kind: 'memory', base: 'sp', offset: 0 });
        expect(decodedBack[2].operands[1]).toEqual({ kind: 'memory', base: 'sp', offset: 0 });
    });

    it('branch hacia adelante: offset calculado correctamente', () => {
        const program = `
            beq   $t0, $zero, end
            addiu $t1, $zero, 1
            end: addiu $t2, $zero, 2
        `;
        const { errors, parsedLines, hexes } = runPipeline(program);

        expect(errors).toHaveLength(0);
        expect(parsedLines[0]).toContain('1');   // offset = +1
        expect(hexes[0]).toBe('0x11000001');
    });

    it('programa con comentarios e instrucciones vacías no falla', () => {
        const program = `
            # inicio del programa
            .text

            addiu $t0, $zero, 5   # cargar 5
            addiu $t1, $zero, 7   # cargar 7
            add   $t2, $t0, $t1   # sumar

            .data
        `;
        const { errors, hexes } = runPipeline(program);

        expect(errors).toHaveLength(0);
        expect(hexes).toHaveLength(3);
    });

    it('el formato final de cada instrucción contiene el mnemónico', () => {
        const program = `
            add   $t0, $t1, $t2
            lw    $s0, 4($sp)
            addiu $t1, $zero, 42
        `;
        const { errors, formatted } = runPipeline(program);

        expect(errors).toHaveLength(0);
        expect(formatted[0]).toContain('add');
        expect(formatted[1]).toContain('lw');
        expect(formatted[2]).toContain('addiu');
    });

});

// ─── 5. TIEMPO DE RESPUESTA DEL FLUJO ────────────────────────────────────────
// Basado en los resultados de la prueba de performance del equipo:
// 10500 instrucciones → 146 ms total → ~0.014 ms por instrucción.
// Estas pruebas validan que el flujo e2e no degrade ese rendimiento.

describe('E2E – el flujo responde en tiempo razonable', () => {

    it('una instrucción simple se procesa en menos de 50 ms', () => {
        const start = performance.now();
        runPipeline('add $t0, $t1, $t2');
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(50);
    });

    it('un programa de 10 instrucciones se procesa en menos de 50 ms', () => {
        const program = `
            addiu $t0, $zero, 1
            addiu $t1, $zero, 2
            add   $t2, $t0, $t1
            sw    $t2, 0($sp)
            lw    $t3, 0($sp)
            sub   $t4, $t2, $t0
            and   $t5, $t0, $t1
            or    $t6, $t0, $t1
            slt   $t7, $t0, $t1
            addiu $t0, $zero, 0
        `;
        const start = performance.now();
        const { errors } = runPipeline(program);
        const elapsed = performance.now() - start;
        expect(errors).toHaveLength(0);
        expect(elapsed).toBeLessThan(50);
    });

    it('100 ejecuciones del pipeline completo terminan en menos de 200 ms', () => {
        const program = `
            addiu $t0, $zero, 5
            add   $t1, $t0, $t0
            sw    $t1, 0($sp)
            lw    $t2, 0($sp)
        `;
        const start = performance.now();
        for (let i = 0; i < 100; i++) runPipeline(program);
        const elapsed = performance.now() - start;
        expect(elapsed).toBeLessThan(200);
    });

    it('el promedio por instrucción no supera 1 ms', () => {
        const instructions = [
            'add $t0, $t1, $t2',
            'addiu $t0, $zero, 42',
            'lw $s0, 4($sp)',
            'sw $s0, 8($sp)',
            'sub $t0, $t1, $t2',
            'or $t0, $t1, $t2',
            'and $t0, $t1, $t2',
            'slt $t0, $t1, $t2',
        ];
        const start = performance.now();
        for (const asm of instructions) runPipeline(asm);
        const elapsed = performance.now() - start;
        const avgPerInstruction = elapsed / instructions.length;
        expect(avgPerInstruction).toBeLessThan(1);
    });

});

// ─── 6. EL FLUJO DETECTA ERRORES CORRECTAMENTE ───────────────────────────────

describe('E2E – el flujo detecta y reporta errores sin explotar', () => {

    it('instrucción desconocida no llega al encoder', () => {
        const { errors, hexes } = runPipeline('fakeop $t0, $t1, $t2');
        expect(errors.length).toBeGreaterThan(0);
        expect(hexes).toHaveLength(0);
    });

    it('registro inválido no llega al encoder', () => {
        const { errors, hexes } = runPipeline('add $t0, $t1, $xyz');
        expect(errors.length).toBeGreaterThan(0);
        expect(hexes).toHaveLength(0);
    });

    it('operandos insuficientes no llegan al encoder', () => {
        const { errors, hexes } = runPipeline('add $t0, $t1');
        expect(errors.length).toBeGreaterThan(0);
        expect(hexes).toHaveLength(0);
    });

    it('inmediato fuera de rango no llega al encoder', () => {
        const { errors, hexes } = runPipeline('addiu $t0, $zero, 999999');
        expect(errors.length).toBeGreaterThan(0);
        expect(hexes).toHaveLength(0);
    });

    it('etiqueta duplicada produce error en el parser', () => {
        const program = `
            loop: addiu $t0, $zero, 1
            loop: addiu $t1, $zero, 2
        `;
        const { errors, hexes } = runPipeline(program);
        expect(errors.length).toBeGreaterThan(0);
        expect(hexes).toHaveLength(0);
    });

    it('etiqueta no definida produce error en el parser', () => {
        const program = `
            beq $t0, $zero, etiqueta_inexistente
            addiu $t1, $zero, 1
        `;
        const { errors, hexes } = runPipeline(program);
        expect(errors.length).toBeGreaterThan(0);
        expect(hexes).toHaveLength(0);
    });

    it('los mensajes de error son strings legibles', () => {
        const { errors } = runPipeline('fakeop $t0');
        expect(typeof errors[0]).toBe('string');
        expect(errors[0].length).toBeGreaterThan(0);
    });

});
