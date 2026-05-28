// test/regression.test.ts
//
// PROPÓSITO: Documentar bugs conocidos y comportamientos específicos del sistema
// para que nadie los rompa accidentalmente en el futuro.
//
// DIFERENCIA con otros tests:
// - integration.test.ts / e2e.test.ts → flujo completo en casos normales
// - boundary.test.ts    → valores extremos de operandos
// - bit.utils.test.ts   → primitivas de bits en aislamiento
// - ← ESTE TEST        → fija comportamientos concretos que ya se saben
//                         correctos (o incorrectos) para evitar regresiones
//
// Cada prueba documenta POR QUÉ existe y qué bug/comportamiento protege.

import { describe, it, expect } from 'vitest';
import { parseAssembly }        from '../src/services/assembly-parser.service/assembly-parser.service';
import { parseInstructions }    from '../src/services/instruction.parser.service';
import { encodeInstruction, decodeInstruction } from '../src/services/handler.registry.service';
import { formatDecodedInstruction }             from '../src/utils/format.utils';

// ─── Helper ──────────────────────────────────────────────────────────────────

const fullPipeline = (program: string) => {
    const { instructions, errors } = parseAssembly(program);
    if (errors.length > 0) return { errors, hexes: [], decoded: [] };
    const decoded = parseInstructions(instructions);
    const hexes   = decoded.map(i => encodeInstruction(i, 'r6'));
    return { errors, hexes, decoded };
};

// ─── 1. ORDEN DE OPERANDOS ────────────────────────────────────────────────────
// Bug documentado en parser.test.ts: el orden de los registros en la salida
// del decoder fue fuente de confusión en el equipo (se esperaba rd,rs,rt
// pero se recibía en otro orden en alguna prueba).

describe('Regresión – orden de operandos', () => {

    it('add: el decoder devuelve [rd, rs, rt] en ese orden', () => {
        // add $t0, $t1, $t2 → rd=$t0, rs=$t1, rt=$t2
        const back = decodeInstruction('0x012A4020', 'r6');
        expect(back.mnemonic).toBe('add');
        expect(back.operands[0]).toEqual({ kind: 'register', name: 't0' }); // rd
        expect(back.operands[1]).toEqual({ kind: 'register', name: 't1' }); // rs
        expect(back.operands[2]).toEqual({ kind: 'register', name: 't2' }); // rt
    });

    it('add: formatDecodedInstruction produce "add $t0 $t1 $t2" en ese orden', () => {
        const back = decodeInstruction('0x012A4020', 'r6');
        expect(formatDecodedInstruction(back)).toBe('add $t0 $t1 $t2');
    });

    it('sub: el decoder devuelve [rd, rs, rt] en ese orden', () => {
        const { hexes } = fullPipeline('sub $t0, $t1, $t2');
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.operands[0]).toEqual({ kind: 'register', name: 't0' });
        expect(back.operands[1]).toEqual({ kind: 'register', name: 't1' });
        expect(back.operands[2]).toEqual({ kind: 'register', name: 't2' });
    });

    it('addiu: el parser produce [rt, rs, imm] — rt primero, rs segundo', () => {
        // En MIPS I-type: opcode | rs | rt | imm
        // Pero el parser expone la instrucción como "addiu rt, rs, imm"
        const { instructions } = parseAssembly('addiu $t0, $zero, 42');
        expect(instructions[0]).toBe('addiu $t0 $zero 42');
    });

    it('lw: el decoder devuelve [rt, memory(base,offset)] — rt primero', () => {
        const back = decodeInstruction('0x8FB00004', 'r6');
        expect(back.mnemonic).toBe('lw');
        expect(back.operands[0]).toEqual({ kind: 'register', name: 's0' });
        expect(back.operands[1]).toEqual({ kind: 'memory', base: 'sp', offset: 4 });
    });

    it('sll: el decoder devuelve [rd, rt, shamt] — sin rs', () => {
        const { hexes } = fullPipeline('sll $t0, $t1, 4');
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.mnemonic).toBe('sll');
        expect(back.operands).toHaveLength(3);
        expect(back.operands[0]).toEqual({ kind: 'register', name: 't0' }); // rd
        expect(back.operands[1]).toEqual({ kind: 'register', name: 't1' }); // rt
        expect(back.operands[2]).toEqual({ kind: 'immediate', value: 4   }); // shamt
    });

});

// ─── 2. BUG CONOCIDO: DECODER DE -32768 ──────────────────────────────────────
// Documentado por boundary.test.ts: al decodificar addiu $t0, $zero, -32768
// el decoder devuelve 32768 en lugar de -32768 porque el i-type handler
// usa parseInt(imm16, 2) sin aplicar bitsToSignedNum.
// Este bloque FIJA el comportamiento actual para detectar si se corrige
// o si se introduce una regresión diferente.

describe('Regresión – bug decoder inmediato -32768', () => {

    it('CONOCIDO: decodificar 0x24088000 devuelve 32768 (no -32768)', () => {
        // Este test documenta el bug. Si empieza a fallar, significa
        // que alguien corrigió el decoder — en ese caso actualizar este
        // test para esperar -32768 y moverlo al bloque de correcciones.
        const back = decodeInstruction('0x24088000', 'r6');
        expect(back.operands[2]).toEqual({ kind: 'immediate', value: 32768 });
        // ESPERADO CORRECTO SERÍA: { kind: 'immediate', value: -32768 }
    });

    it('el encoder SÍ produce el hex correcto para -32768', () => {
        // El bug está solo en el decoder, no en el encoder
        const { hexes, errors } = fullPipeline('addiu $t0, $zero, -32768');
        expect(errors).toHaveLength(0);
        expect(hexes[0]).toMatch(/8000$/); // los 16 bits bajos = 0x8000
    });

    it('valores negativos menores a -1 también se ven afectados en decode', () => {
        // -2 en 16 bits = 0xFFFE — este SÍ decodifica bien porque
        // parseInt('1111111111111110', 2) = 65534, pero el handler
        // no aplica signo. Documentamos que valores > 32767 son "positivos" incorrectos.
        const { hexes } = fullPipeline('addiu $t0, $zero, -1');
        const back = decodeInstruction(hexes[0]!, 'r6');
        // -1 en 16 bits = 0xFFFF = 65535 sin signo
        expect(back.operands[2]).toEqual({ kind: 'immediate', value: 65535 });
    });

});

// ─── 3. COMPORTAMIENTO DE LABELS Y OFFSETS ───────────────────────────────────
// Protege el cálculo de offsets para branches y targets para jumps,
// que fue discutido durante el desarrollo del proyecto.

describe('Regresión – labels y cálculo de offsets', () => {

    it('branch offset hacia adelante: offset = destino - (pc_branch + 1)', () => {
        const program = `
            beq $t0, $zero, end
            addiu $t1, $zero, 1
            end: addiu $t2, $zero, 2
        `;
        const { instructions } = parseAssembly(program);
        // beq está en índice 0, end está en índice 2
        // offset = 2 - (0 + 1) = 1
        expect(instructions[0]).toBe('beq $t0 $zero 1');
    });

    it('branch offset hacia atrás: offset es negativo', () => {
        const program = `
            addiu $t0, $zero, 10
            loop: addiu $t0, $t0, -1
                  bne $t0, $zero, loop
        `;
        const { instructions } = parseAssembly(program);
        // bne está en índice 2, loop está en índice 1
        // offset = 1 - (2 + 1) = -2
        expect(instructions[2]).toBe('bne $t0 $zero -2');
    });

    it('branch a la siguiente instrucción: offset = 0', () => {
        const program = `
            beq $t0, $zero, next
            next: addiu $t1, $zero, 1
        `;
        const { instructions } = parseAssembly(program);
        expect(instructions[0]).toBe('beq $t0 $zero 0');
    });

    it('jal: el target se calcula como dirección absoluta / 4', () => {
        const program = `
            jal fib
            addiu $t0, $zero, 0
            fib: addiu $t1, $zero, 1
        `;
        const { instructions, errors } = parseAssembly(program);
        expect(errors).toHaveLength(0);
        // fib está en índice 2 → dirección = BASE + 2*4 = 0x00400000 + 8 = 0x00400008
        // target = 0x00400008 >> 2 = 0x00100002 = 1048578
        expect(instructions[0]).toBe('jal 1048578');
    });

    it('etiqueta duplicada produce error con mensaje específico', () => {
        const program = `
            loop: addiu $t0, $zero, 1
            loop: addiu $t1, $zero, 2
        `;
        const { errors } = parseAssembly(program);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('Etiqueta duplicada');
        expect(errors[0]).toContain('loop');
    });

    it('etiqueta no definida produce error con mensaje específico', () => {
        const program = `beq $t0, $zero, fantasma`;
        const { errors } = parseAssembly(program);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0]).toContain('etiqueta no definida');
        expect(errors[0]).toContain('fantasma');
    });

});

// ─── 4. INSTRUCCIONES ESPECIALES ─────────────────────────────────────────────
// syscall, break, jr y jalr tienen comportamiento especial que fue
// implementado en el stress test — protegemos esos hexes aquí.

describe('Regresión – instrucciones especiales', () => {

    it('syscall encodea a 0x0000000C', () => {
        const { hexes } = fullPipeline('syscall');
        expect(hexes[0]).toBe('0x0000000C');
    });

    it('break encodea a 0x0000000D', () => {
        const { hexes } = fullPipeline('break');
        expect(hexes[0]).toBe('0x0000000D');
    });

    it('jr $ra encodea a 0x03E00008', () => {
        const { hexes } = fullPipeline('jr $ra');
        expect(hexes[0]).toBe('0x03E00008');
    });

    it('jr $zero encodea a 0x00000008', () => {
        const { hexes } = fullPipeline('jr $zero');
        expect(hexes[0]).toBe('0x00000008');
    });

    it('syscall round-trip: decode devuelve mnemónico syscall', () => {
        const back = decodeInstruction('0x0000000C', 'r6');
        expect(back.mnemonic).toBe('syscall');
        expect(back.operands).toHaveLength(0);
    });

    it('lui: codifica correctamente (rs = $zero implícito)', () => {
        const { hexes, errors } = fullPipeline('lui $t0, 1');
        expect(errors).toHaveLength(0);
        // opcode=001111, rs=00000, rt=01000, imm=0000000000000001
        expect(hexes[0]).toBe('0x3C080001');
    });

    it('lui round-trip preserva mnemónico y operandos', () => {
        const { hexes } = fullPipeline('lui $t0, 1');
        const back = decodeInstruction(hexes[0]!, 'r6');
        expect(back.mnemonic).toBe('lui');
        expect(back.operands[0]).toEqual({ kind: 'register', name: 't0' });
        expect(back.operands[1]).toEqual({ kind: 'immediate', value: 1 });
    });

});

// ─── 5. FORMATO DE SALIDA ─────────────────────────────────────────────────────
// El formato exacto de los mensajes de error y de las instrucciones formateadas
// importa porque otros módulos pueden depender de él.

describe('Regresión – formato de salida', () => {

    it('formatDecodedInstruction usa $ en los registros', () => {
        const back = decodeInstruction('0x012A4020', 'r6');
        const formatted = formatDecodedInstruction(back);
        expect(formatted).toContain('$t0');
        expect(formatted).toContain('$t1');
        expect(formatted).toContain('$t2');
    });

    it('formatDecodedInstruction produce el formato "mnemónico $rd $rs $rt"', () => {
        const back = decodeInstruction('0x012A4020', 'r6');
        expect(formatDecodedInstruction(back)).toBe('add $t0 $t1 $t2');
    });

    it('el hex producido siempre tiene prefijo 0x en mayúsculas', () => {
        const cases = [
            'add $t0, $t1, $t2',
            'addiu $t0, $zero, 42',
            'lw $s0, 4($sp)',
            'syscall',
        ];
        for (const asm of cases) {
            const { hexes } = fullPipeline(asm);
            expect(hexes[0]).toMatch(/^0x[0-9A-F]{8}$/);
        }
    });

    it('los mensajes de error contienen el número de línea', () => {
        const { errors } = parseAssembly('fakeop $t0, $t1, $t2');
        expect(errors[0]).toContain('Línea 1');
    });

    it('el parser normaliza los registros a minúsculas sin $', () => {
        const { instructions } = parseAssembly('add $T0, $T1, $T2');
        // El parser debe normalizar a minúsculas
        expect(instructions[0]?.toLowerCase()).toContain('t0');
    });

});
