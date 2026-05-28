/**
 * constants.integrity.test.ts
 *
 * PROPÓSITO: Validar la integridad estructural de todas las tablas de constantes.
 * Este test NO prueba lógica de codificación/decodificación, sino que verifica
 * que las tablas en sí mismas sean internamente consistentes y correctas.
 *
 * DIFERENCIA con otros tests:
 * - integration.test.ts / e2e.test.ts → flujo completo ensamblador ↔ hex
 * - parser.test.ts      → parsing de líneas individuales
 * - registry.test.ts    → codificación/decodificación de instrucciones
 * - bit.utils.test.ts   → primitivas de bits en aislamiento
 * - ← ESTE TEST        → las tablas de constantes son válidas por sí mismas
 *
 * Si cualquiera de estas propiedades falla, TODOS los demás tests son
 * sospechosos aunque pasen, porque operarían sobre datos corruptos.
 */

import { describe, it, expect } from "vitest";
import { FUNCT, SHAMT_R6 } from "../src/constants/funct.constants";
import { OPCODES, REGIMM } from "../src/constants/opcodes.constants";
import {
  REGISTER_BY_BITS,
  REGISTER_BY_NAME,
  REG_ZERO,
  REG_RA,
} from "../src/constants/registers.constants";
import {
  ENCODING_BY_MNEMONIC,
  ENCODING_BY_FUNCT,
  INSTRUCTION_ENCODINGS,
} from "../src/constants/instructions.constants";
import {
  R_TYPE_MNEMONICS,
  I_TYPE_MNEMONICS,
  J_TYPE_MNEMONICS,
  MEMORY_MNEMONICS,
  BRANCH_MNEMONICS,
} from "../src/constants/set.constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findDuplicates<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const item of arr) {
    if (seen.has(item)) duplicates.add(item);
    seen.add(item);
  }
  return [...duplicates];
}

/** Verifica que una cadena sea exactamente N caracteres de '0' y '1'. */
const isBinaryString = (s: string, len: number): boolean =>
  s.length === len && /^[01]+$/.test(s);

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 1: FUNCT (funct.constants.ts)
// ═══════════════════════════════════════════════════════════════════════════
describe("FUNCT (funct.constants.ts)", () => {
  it("la tabla no está vacía", () => {
    expect(Object.keys(FUNCT).length).toBeGreaterThan(0);
  });

  it("todos los function codes son cadenas binarias de exactamente 6 bits", () => {
    const invalids = Object.entries(FUNCT).filter(
      ([, bits]) => !isBinaryString(bits, 6),
    );
    expect(invalids).toEqual([]);
  });

  it("no hay mnemónicos duplicados en la tabla", () => {
    const keys = Object.keys(FUNCT);
    expect(findDuplicates(keys)).toEqual([]);
  });

  it("los function codes de instrucciones aritméticas básicas son correctos", () => {
    expect(FUNCT.ADD).toBe("100000");
    expect(FUNCT.ADDU).toBe("100001");
    expect(FUNCT.SUB).toBe("100010");
    expect(FUNCT.AND).toBe("100100");
    expect(FUNCT.OR).toBe("100101");
    expect(FUNCT.SLT).toBe("101010");
  });

  it("el funct de SLL es 000000 (campo especial)", () => {
    // SLL con shamt=0 y rs=rt=rd=0 → NOP canónico
    expect(FUNCT.SLL).toBe("000000");
  });

  it("SHAMT_R6 tiene valores binarios de exactamente 5 bits", () => {
    const invalids = Object.entries(SHAMT_R6).filter(
      ([, bits]) => !isBinaryString(bits, 5),
    );
    expect(invalids).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 2: OPCODES (opcodes.constants.ts)
// ═══════════════════════════════════════════════════════════════════════════
describe("OPCODES (opcodes.constants.ts)", () => {
  it("la tabla no está vacía", () => {
    expect(Object.keys(OPCODES).length).toBeGreaterThan(0);
  });

  it("todos los opcodes son cadenas binarias de exactamente 6 bits", () => {
    const invalids = Object.entries(OPCODES).filter(
      ([, bits]) => !isBinaryString(bits, 6),
    );
    expect(invalids).toEqual([]);
  });

  it("SPECIAL es 000000 (reservado para instrucciones R-type)", () => {
    expect(OPCODES.SPECIAL).toBe("000000");
  });

  it("no hay mnemónicos duplicados en la tabla", () => {
    const keys = Object.keys(OPCODES);
    expect(findDuplicates(keys)).toEqual([]);
  });

  it("REGIMM tiene valores de 5 bits (campo rt usado como discriminador)", () => {
    const invalids = Object.entries(REGIMM).filter(
      ([, bits]) => !isBinaryString(bits, 5),
    );
    expect(invalids).toEqual([]);
  });

  it("opcodes de instrucciones de memoria conocidas son correctos", () => {
    expect(OPCODES.LW).toBe("100011"); // 35
    expect(OPCODES.SW).toBe("101011"); // 43
    expect(OPCODES.LB).toBe("100000"); // 32
    expect(OPCODES.SB).toBe("101000"); // 40
  });

  it("opcodes de branch son distintos entre sí", () => {
    const branchOpcodes = [
      OPCODES.BEQ,
      OPCODES.BNE,
      OPCODES.BLEZ,
      OPCODES.BGTZ,
    ];
    const unique = new Set(branchOpcodes);
    expect(unique.size).toBe(branchOpcodes.length);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 3: REGISTROS (registers.constants.ts)
// ═══════════════════════════════════════════════════════════════════════════
describe("REGISTERS (registers.constants.ts)", () => {
  it("REGISTER_BY_BITS tiene exactamente 32 entradas", () => {
    expect(Object.keys(REGISTER_BY_BITS).length).toBe(32);
  });

  it("todas las claves de REGISTER_BY_BITS son cadenas binarias de 5 bits", () => {
    const invalids = Object.keys(REGISTER_BY_BITS).filter(
      (bits) => !isBinaryString(bits, 5),
    );
    expect(invalids).toEqual([]);
  });

  it("REGISTER_BY_BITS cubre exactamente todos los valores de 5 bits (00000–11111)", () => {
    const keys = Object.keys(REGISTER_BY_BITS).map((b) => parseInt(b, 2));
    const sorted = keys.sort((a, b) => a - b);
    expect(sorted).toEqual(Array.from({ length: 32 }, (_, i) => i));
  });

  it("REGISTER_BY_NAME es la inversa exacta de REGISTER_BY_BITS", () => {
    for (const [bits, name] of Object.entries(REGISTER_BY_BITS)) {
      expect(REGISTER_BY_NAME[name as keyof typeof REGISTER_BY_NAME]).toBe(
        bits,
      );
    }
  });

  it("REG_ZERO es 00000", () => {
    expect(REG_ZERO).toBe("00000");
  });

  it("REG_RA es 11111 (registro 31)", () => {
    expect(REG_RA).toBe("11111");
  });

  it("registros convencionales tienen los números correctos", () => {
    expect(parseInt(REGISTER_BY_NAME["sp"], 2)).toBe(29);
    expect(parseInt(REGISTER_BY_NAME["fp"], 2)).toBe(30);
    expect(parseInt(REGISTER_BY_NAME["ra"], 2)).toBe(31);
    expect(parseInt(REGISTER_BY_NAME["zero"], 2)).toBe(0);
    expect(parseInt(REGISTER_BY_NAME["at"], 2)).toBe(1);
  });

  it("todos los nombres de registro son strings no vacíos", () => {
    const invalids = Object.values(REGISTER_BY_BITS).filter(
      (name) => typeof name !== "string" || name.trim() === "",
    );
    expect(invalids).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 4: INSTRUCTION_ENCODINGS / ENCODING_BY_MNEMONIC
// ═══════════════════════════════════════════════════════════════════════════
describe("INSTRUCTION_ENCODINGS (instructions.constants.ts)", () => {
  it("el array no está vacío", () => {
    expect(INSTRUCTION_ENCODINGS.length).toBeGreaterThan(0);
  });

  it("cada encoding tiene los campos obligatorios (mnemonic, type, opcode, args)", () => {
    const invalids = INSTRUCTION_ENCODINGS.filter(
      (e) => !e.mnemonic || !e.type || !e.opcode || !Array.isArray(e.args),
    );
    expect(invalids).toEqual([]);
  });

  it("todos los types son R, I, J o B", () => {
    const validTypes = new Set(["R", "I", "J", "B"]);
    const invalids = INSTRUCTION_ENCODINGS.filter(
      (e) => !validTypes.has(e.type),
    );
    expect(invalids).toEqual([]);
  });

  it("todos los opcodes son cadenas binarias de 6 bits", () => {
    const invalids = INSTRUCTION_ENCODINGS.filter(
      (e) => !isBinaryString(e.opcode, 6),
    );
    expect(invalids).toEqual([]);
  });

  it("todos los funct (cuando existen) son cadenas binarias de 6 bits", () => {
    const invalids = INSTRUCTION_ENCODINGS.filter(
      (e) => e.funct !== undefined && !isBinaryString(e.funct, 6),
    );
    expect(invalids).toEqual([]);
  });

  it("todos los shamt (cuando existen) son cadenas binarias de 5 bits", () => {
    const invalids = INSTRUCTION_ENCODINGS.filter(
      (e) => e.shamt !== undefined && !isBinaryString(e.shamt, 5),
    );
    expect(invalids).toEqual([]);
  });

  it("ningún mnemónico está duplicado en ENCODING_BY_MNEMONIC", () => {
    const keys = Object.keys(ENCODING_BY_MNEMONIC);
    expect(findDuplicates(keys)).toEqual([]);
  });

  it("todas las instrucciones R-type tienen funct definido", () => {
    const rTypes = INSTRUCTION_ENCODINGS.filter((e) => e.type === "R");
    const missing = rTypes.filter((e) => e.funct === undefined);
    expect(missing.map((e) => e.mnemonic)).toEqual([]);
  });

  it("ENCODING_BY_FUNCT no tiene colisiones de clave (funct:shamt únicas)", () => {
    // Si hay colisión, el último valor silenciosamente sobreescribe al anterior
    const keys = Object.keys(ENCODING_BY_FUNCT);
    expect(findDuplicates(keys)).toEqual([]);
  });

  it("instrucciones conocidas existen en ENCODING_BY_MNEMONIC (en minúscula)", () => {
    const required = [
      "add",
      "sub",
      "and",
      "or",
      "slt",
      "addiu",
      "lw",
      "sw",
      "beq",
      "j",
    ];
    for (const m of required) {
      expect(ENCODING_BY_MNEMONIC).toHaveProperty(m);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// BLOQUE 5: CONJUNTOS DE MNEMONICS (set.constants.ts)
// ═══════════════════════════════════════════════════════════════════════════
describe("Conjuntos de mnemonics (set.constants.ts)", () => {
  it("R_TYPE_MNEMONICS no está vacío", () => {
    expect(R_TYPE_MNEMONICS.length).toBeGreaterThan(0);
  });

  it("I_TYPE_MNEMONICS no está vacío", () => {
    expect(I_TYPE_MNEMONICS.length).toBeGreaterThan(0);
  });

  it("J_TYPE_MNEMONICS no está vacío", () => {
    expect(J_TYPE_MNEMONICS.length).toBeGreaterThan(0);
  });

  it("no hay duplicados dentro de R_TYPE_MNEMONICS", () => {
    expect(findDuplicates([...R_TYPE_MNEMONICS])).toEqual([]);
  });

  it("no hay duplicados dentro de I_TYPE_MNEMONICS", () => {
    expect(findDuplicates([...I_TYPE_MNEMONICS])).toEqual([]);
  });

  it("no hay duplicados dentro de J_TYPE_MNEMONICS", () => {
    expect(findDuplicates([...J_TYPE_MNEMONICS])).toEqual([]);
  });

  it("ningún mnemónico aparece en más de un conjunto de tipo puro (R/I/J)", () => {
    const allWithType = [
      ...R_TYPE_MNEMONICS.map((m: string) => ({ m, t: "R" })),
      ...I_TYPE_MNEMONICS.map((m: string) => ({ m, t: "I" })),
      ...J_TYPE_MNEMONICS.map((m: string) => ({ m, t: "J" })),
    ];
    const counts = new Map<string, string[]>();
    for (const { m, t } of allWithType) {
      counts.set(m, [...(counts.get(m) ?? []), t]);
    }
    const crossType = [...counts.entries()].filter(
      ([, types]) => types.length > 1,
    );
    expect(crossType).toEqual([]);
  });

  it("todos los R-type mnemonics tienen type R en ENCODING_BY_MNEMONIC", () => {
    const wrongType = R_TYPE_MNEMONICS.filter((m: string) => {
      const enc = ENCODING_BY_MNEMONIC[m];
      return enc && enc.type !== "R";
    });
    expect(wrongType).toEqual([]);
  });

  it("todos los I-type mnemonics tienen type I en ENCODING_BY_MNEMONIC", () => {
    const wrongType = I_TYPE_MNEMONICS.filter((m: string) => {
      const enc = ENCODING_BY_MNEMONIC[m];
      return enc && enc.type !== "I";
    });
    expect(wrongType).toEqual([]);
  });

  it("MEMORY_MNEMONICS y BRANCH_MNEMONICS no están vacíos", () => {
    expect(MEMORY_MNEMONICS.length).toBeGreaterThan(0);
    expect(BRANCH_MNEMONICS.length).toBeGreaterThan(0);
  });

  it("lw y sw están en MEMORY_MNEMONICS", () => {
    expect(MEMORY_MNEMONICS).toContain("lw");
    expect(MEMORY_MNEMONICS).toContain("sw");
  });

  it("beq y bne están en BRANCH_MNEMONICS", () => {
    expect(BRANCH_MNEMONICS).toContain("beq");
    expect(BRANCH_MNEMONICS).toContain("bne");
  });
});
