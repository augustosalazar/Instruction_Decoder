// test/performance/performance.test.ts

import { describe, it, expect } from 'vitest';

import { parseAssembly } from '../src/services/assembly-parser.service/assembly-parser.service';

import { parseInstructions } from '../src/services/instruction.parser.service';

import {
    encodeInstruction,
    decodeInstruction,
} from '../src/services/handler.registry.service';

/**
 * Genera instrucciones assembly automáticamente
 *
 * Cada iteración genera 7 instrucciones.
 */
function generateProgram(iterations: number): string {

    const instructions: string[] = [];

    for (let i = 0; i < iterations; i++) {

        instructions.push(`add $t0, $t1, $t2`);

        instructions.push(`sub $s0, $s1, $s2`);

        instructions.push(`addiu $t0, $zero, ${i % 100}`);

        instructions.push(`lw $s0, 4($sp)`);

        instructions.push(`sw $s0, 8($sp)`);

        instructions.push(`beq $t0, $zero, label${i}`);

        instructions.push(`label${i}: addiu $t1, $zero, 1`);
    }

    return instructions.join('\n');
}

/**
 * Ejecuta benchmark completo
 */
function runBenchmark(
    name: string,
    iterations: number,
    maxAllowedTime: number
) {

    console.log('');
    console.log('====================================================');
    console.log(` STARTING BENCHMARK: ${name}`);
    console.log('====================================================');

    // =====================================================
    // GENERAR PROGRAMA
    // =====================================================

    const generationStart = performance.now();

    const program = generateProgram(iterations);

    const generationEnd = performance.now();

    // =====================================================
    // PARSE ASSEMBLY
    // =====================================================

    const parseStart = performance.now();

    const parsed = parseAssembly(program);

    const parseEnd = performance.now();

    expect(parsed.errors).toHaveLength(0);

    // =====================================================
    // PARSE INSTRUCTIONS
    // =====================================================

    const instructionStart = performance.now();

    const decoded = parseInstructions(parsed.instructions);

    const instructionEnd = performance.now();

    // =====================================================
    // ENCODE
    // =====================================================

    const encodeStart = performance.now();

    const hexes = decoded.map(d =>
        encodeInstruction(d, 'r6')
    );

    const encodeEnd = performance.now();

    // =====================================================
    // DECODE
    // =====================================================

    const decodeStart = performance.now();

    const back = hexes.map(h =>
        decodeInstruction(h, 'r6')
    );

    const decodeEnd = performance.now();

    // =====================================================
    // TIEMPOS
    // =====================================================

    const generationTime =
        generationEnd - generationStart;

    const parseTime =
        parseEnd - parseStart;

    const instructionTime =
        instructionEnd - instructionStart;

    const encodeTime =
        encodeEnd - encodeStart;

    const decodeTime =
        decodeEnd - decodeStart;

    const totalTime =
        decodeEnd - generationStart;

    // =====================================================
    // RESULTADOS
    // =====================================================

    console.log('');
    console.log('====================================================');
    console.log(` RESULTS: ${name}`);
    console.log('====================================================');

    console.log(
        `Instructions processed: ${parsed.instructions.length}`
    );

    console.log('');

    console.log(
        `Program Generation:    ${generationTime.toFixed(2)} ms`
    );

    console.log(
        `Assembly Parsing:      ${parseTime.toFixed(2)} ms`
    );

    console.log(
        `Instruction Parsing:   ${instructionTime.toFixed(2)} ms`
    );

    console.log(
        `Encoding:              ${encodeTime.toFixed(2)} ms`
    );

    console.log(
        `Decoding:              ${decodeTime.toFixed(2)} ms`
    );

    console.log('');

    console.log(
        `TOTAL TIME:            ${totalTime.toFixed(2)} ms`
    );

    console.log('');

    console.log(
        `Average per instruction: ${(
            totalTime / parsed.instructions.length
        ).toFixed(6)} ms`
    );

    console.log('====================================================');
    console.log('');

    // =====================================================
    // VALIDACIONES
    // =====================================================

    expect(back.length).toBe(parsed.instructions.length);

    expect(totalTime).toBeLessThan(maxAllowedTime);
}

describe('Performance Testing - Scalability', () => {

    /**
     * ~10,500 instrucciones
     */
    it('benchmark 10K instrucciones', () => {

        runBenchmark(
            '10K Instructions',
            1500,
            10000
        );

    });

    /**
     * ~105,000 instrucciones
     */
    it('benchmark 100K instrucciones', () => {

        runBenchmark(
            '100K Instructions',
            15000,
            30000
        );

    });

    /**
     * ~525,000 instrucciones
     */
    it('benchmark 500K instrucciones', () => {

        runBenchmark(
            '500K Instructions',
            75000,
            120000
        );

    });

    /**
     * ~1,050,000 instrucciones
     */
    it('benchmark 1M instrucciones', () => {

        runBenchmark(
            '1M Instructions',
            150000,
            300000
        );

    },
    120000
    );

});