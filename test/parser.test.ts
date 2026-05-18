// test/parser/assembly-parser.test.ts

import { describe, it, expect } from 'vitest';
import { parseAssembly } from '../src/services/assembly-parser.service/assembly-parser.service';

describe('AssemblyParser', () => {
    it('muestra formato de salida', () => {
        const result = parseAssembly(`
        add   $t0, $t1, $t2
        lw    $s0, 4($sp)
        addiu $t1, $zero, 42
        beq   $t0, $zero, fin
        fin: jr $ra
    `);
        console.log(result.instructions);
    });

    it('parsea una instrucción simple', () => {
        const result = parseAssembly('add $t0, $t1, $t2');
        expect(result.errors).toHaveLength(0);
        expect(result.instructions).toHaveLength(1);
        expect(result.instructions[0]).toBe('add $t1 $t2 $t0');
    });

    it('parsea múltiples instrucciones', () => {
        const result = parseAssembly(`
      add  $t0, $t1, $t2
      lw   $s0, 4($sp)
      addiu $t1, $zero, 42
    `);
        expect(result.errors).toHaveLength(0);
        expect(result.instructions).toHaveLength(3);
    });

    it('detecta instrucción desconocida', () => {
        const result = parseAssembly('foo $t0, $t1');
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('desconocida');
    });

    it('detecta registro inválido', () => {
        const result = parseAssembly('add $t0, $t1, $xyz');
        expect(result.errors).toHaveLength(1);
    });

    it('resuelve labels en branches', () => {
        const result = parseAssembly(`
    loop: add $t0, $t1, $t2
            beq $t0, $zero, loop
    `);
        expect(result.errors).toHaveLength(0);
        expect(result.instructions[1]).toContain('-2');
    });

});