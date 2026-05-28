/**
 * bit.utils.test.ts
 *
 * PROPÓSITO: Pruebas unitarias de las funciones en src/utils/bit.utils.ts.
 * Estas funciones son la CAPA MÁS BAJA del sistema — sin ellas, ningún
 * encode ni decode funciona. Sin embargo, no tienen ningún test dedicado.
 *
 * DIFERENCIA con todos los otros tests:
 * - integration.test.ts / e2e.test.ts → prueban el pipeline completo
 * - registry.test.ts  → prueba encode/decode a nivel de instrucción
 * - parser.test.ts    → prueba el parser de texto ensamblador
 * - ← ESTE TEST      → prueba las primitivas de bits en aislamiento total,
 *                       sin pasar por handlers, parsers ni servicios
 *
 * Si una de estas funciones está mal, TODOS los tests de integración pueden
 * pasar con valores incorrectos porque los errores se cancelan entre sí
 * (ej: un encode mal + un decode mal = round-trip "correcto" pero roto).
 */

import { describe, it, expect } from "vitest";
import {
  hexToBits,
  bitsToHex,
  constToBits,
  bitsToUnsignedNum,
  bitsToSignedNum,
  sliceBits,
} from "../src/utils/bit.utils";

// ═══════════════════════════════════════════════════════════════════════════
// hexToBits
// ═══════════════════════════════════════════════════════════════════════════
describe("hexToBits", () => {
  it("convierte 0x00000000 a 32 ceros", () => {
    expect(hexToBits("0x00000000")).toBe("0".repeat(32));
  });

  it("convierte 0xFFFFFFFF a 32 unos", () => {
    expect(hexToBits("0xFFFFFFFF")).toBe("1".repeat(32));
  });

  it("convierte 0x012A4020 correctamente (add $t0,$t1,$t2)", () => {
    expect(hexToBits("0x012A4020")).toBe("00000001001010100100000000100000");
  });

  it("convierte 0x2408002A correctamente (addiu $t0,$zero,42)", () => {
    expect(hexToBits("0x2408002A")).toBe("00100100000010000000000000101010");
  });

  it("acepta hex sin prefijo 0x", () => {
    expect(hexToBits("012A4020")).toBe("00000001001010100100000000100000");
  });

  it("acepta prefijo 0x en minúscula", () => {
    expect(hexToBits("0x012a4020")).toBe("00000001001010100100000000100000");
  });

  it("produce exactamente 32 caracteres para una instrucción completa", () => {
    expect(hexToBits("0x012A4020").length).toBe(32);
    expect(hexToBits("0x00000000").length).toBe(32);
    expect(hexToBits("0xFFFFFFFF").length).toBe(32);
  });

  it("produce solo caracteres 0 y 1", () => {
    const bits = hexToBits("0xDEADBEEF");
    expect(/^[01]+$/.test(bits)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// bitsToHex
// ═══════════════════════════════════════════════════════════════════════════
describe("bitsToHex", () => {
  it("convierte 32 ceros a 0x00000000", () => {
    expect(bitsToHex("0".repeat(32))).toBe("0x00000000");
  });

  it("convierte 32 unos a 0xFFFFFFFF", () => {
    expect(bitsToHex("1".repeat(32))).toBe("0xFFFFFFFF");
  });

  it("convierte los bits de add $t0,$t1,$t2 a 0x012A4020", () => {
    expect(bitsToHex("00000001001010100100000000100000")).toBe("0x012A4020");
  });

  it("siempre produce el prefijo 0x", () => {
    expect(bitsToHex("0".repeat(32))).toMatch(/^0x/);
    expect(bitsToHex("1".repeat(32))).toMatch(/^0x/);
  });

  it("produce letras hex en mayúscula", () => {
    // 'a' minúscula sería incorrecto
    expect(bitsToHex("1".repeat(32))).toBe("0xFFFFFFFF");
    expect(bitsToHex("00000001001010100100000000100000")).toBe("0x012A4020");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Roundtrip hexToBits ↔ bitsToHex
// ═══════════════════════════════════════════════════════════════════════════
describe("hexToBits ↔ bitsToHex (roundtrip)", () => {
  const cases = [
    "0x00000000",
    "0xFFFFFFFF",
    "0x012A4020", // add $t0, $t1, $t2
    "0x2408002A", // addiu $t0, $zero, 42
    "0x8FB00004", // lw $s0, 4($sp)
    "0xAFB00008", // sw $s0, 8($sp)
    "0x11000001", // beq con offset +1
    "0x08000000", // j 0
  ];

  for (const hex of cases) {
    it(`bitsToHex(hexToBits("${hex}")) === "${hex}"`, () => {
      expect(bitsToHex(hexToBits(hex))).toBe(hex);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// constToBits
// ═══════════════════════════════════════════════════════════════════════════
describe("constToBits", () => {
  describe("valores positivos", () => {
    it("convierte 0 a N ceros", () => {
      expect(constToBits(0, 6)).toBe("000000");
      expect(constToBits(0, 16)).toBe("0".repeat(16));
      expect(constToBits(0, 5)).toBe("00000");
    });

    it("convierte 1 con el padding correcto", () => {
      expect(constToBits(1, 5)).toBe("00001");
      expect(constToBits(1, 6)).toBe("000001");
      expect(constToBits(1, 16)).toBe("0".repeat(15) + "1");
    });

    it("produce el máximo para cada ancho (todos unos)", () => {
      expect(constToBits(63, 6)).toBe("111111"); // opcode máximo
      expect(constToBits(31, 5)).toBe("11111"); // registro máximo
      expect(constToBits(65535, 16)).toBe("1".repeat(16));
    });

    it("convierte functs conocidos correctamente", () => {
      expect(constToBits(32, 6)).toBe("100000"); // ADD
      expect(constToBits(34, 6)).toBe("100010"); // SUB
      expect(constToBits(36, 6)).toBe("100100"); // AND
      expect(constToBits(37, 6)).toBe("100101"); // OR
    });

    it("convierte números de registro conocidos correctamente", () => {
      expect(constToBits(0, 5)).toBe("00000"); // $zero
      expect(constToBits(8, 5)).toBe("01000"); // $t0
      expect(constToBits(9, 5)).toBe("01001"); // $t1
      expect(constToBits(29, 5)).toBe("11101"); // $sp
      expect(constToBits(31, 5)).toBe("11111"); // $ra
    });

    it("trunca al ancho indicado (descarta bits de orden superior)", () => {
      // 255 = 11111111, en 6 bits = 111111 (descarta los 2 primeros)
      expect(constToBits(255, 6)).toBe("111111");
      // 8 = 1000, en 3 bits = 000 (descarta el bit 1)
      expect(constToBits(8, 3)).toBe("000");
    });
  });

  describe("valores negativos (complemento a dos)", () => {
    it("convierte -1 a todos unos", () => {
      expect(constToBits(-1, 16)).toBe("1111111111111111");
    });

    it("convierte -4 correctamente", () => {
      expect(constToBits(-4, 16)).toBe("1111111111111100");
    });

    it("convierte el mínimo en 16 bits (-32768)", () => {
      expect(constToBits(-32768, 16)).toBe("1000000000000000");
    });

    it("convierte -1 en 5 bits (campo shamt negativo en contexto LSA)", () => {
      expect(constToBits(-1, 5)).toBe("11111");
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// bitsToUnsignedNum
// ═══════════════════════════════════════════════════════════════════════════
describe("bitsToUnsignedNum", () => {
  it("interpreta 000000 como 0", () => {
    expect(bitsToUnsignedNum("000000")).toBe(0);
  });

  it("interpreta 111111 como 63", () => {
    expect(bitsToUnsignedNum("111111")).toBe(63);
  });

  it("interpreta registros correctamente", () => {
    expect(bitsToUnsignedNum("00000")).toBe(0); // $zero
    expect(bitsToUnsignedNum("01000")).toBe(8); // $t0
    expect(bitsToUnsignedNum("01001")).toBe(9); // $t1
    expect(bitsToUnsignedNum("11101")).toBe(29); // $sp
    expect(bitsToUnsignedNum("11111")).toBe(31); // $ra
  });

  it("trata el bit más significativo como valor, no como signo", () => {
    // En modo sin signo, 1000000000000000 = 32768, NO -32768
    expect(bitsToUnsignedNum("1000000000000000")).toBe(32768);
    expect(bitsToUnsignedNum("1111111111111111")).toBe(65535);
  });

  it("interpreta el inmediato de addiu $t0,$zero,42 correctamente", () => {
    expect(bitsToUnsignedNum("0000000000101010")).toBe(42);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// bitsToSignedNum
// ═══════════════════════════════════════════════════════════════════════════
describe("bitsToSignedNum", () => {
  it("interpreta 0 como 0", () => {
    expect(bitsToSignedNum("0000000000000000", 16)).toBe(0);
  });

  it("interpreta valores positivos normalmente", () => {
    expect(bitsToSignedNum("0000000000000001", 16)).toBe(1);
    expect(bitsToSignedNum("0000000000101010", 16)).toBe(42);
    expect(bitsToSignedNum("0111111111111111", 16)).toBe(32767); // máx positivo en 16 bits
  });

  it("interpreta 1111111111111111 como -1 (complemento a dos)", () => {
    expect(bitsToSignedNum("1111111111111111", 16)).toBe(-1);
  });

  it("interpreta 1111111111111100 como -4 (offset lw -4($sp))", () => {
    expect(bitsToSignedNum("1111111111111100", 16)).toBe(-4);
  });

  it("interpreta 1000000000000000 como -32768 (mínimo en 16 bits)", () => {
    expect(bitsToSignedNum("1000000000000000", 16)).toBe(-32768);
  });

  it("respeta el parámetro width para distintos anchos", () => {
    // En 8 bits: 10000001 = -127
    expect(bitsToSignedNum("10000001", 8)).toBe(-127);
    // En 5 bits: 11111 = -1
    expect(bitsToSignedNum("11111", 5)).toBe(-1);
    // En 5 bits: 10000 = -16
    expect(bitsToSignedNum("10000", 5)).toBe(-16);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Roundtrip constToBits ↔ bitsToUnsignedNum / bitsToSignedNum
// ═══════════════════════════════════════════════════════════════════════════
describe("constToBits ↔ bitsToUnsignedNum / bitsToSignedNum (roundtrip)", () => {
  it("todos los números de registro (0–31) sobreviven el roundtrip sin signo", () => {
    for (let reg = 0; reg <= 31; reg++) {
      const bits = constToBits(reg, 5);
      expect(bitsToUnsignedNum(bits)).toBe(reg);
    }
  });

  it("todos los opcodes válidos (0–63) sobreviven el roundtrip sin signo", () => {
    for (let op = 0; op <= 63; op++) {
      const bits = constToBits(op, 6);
      expect(bitsToUnsignedNum(bits)).toBe(op);
    }
  });

  it("inmediatos positivos en 16 bits sobreviven el roundtrip con signo", () => {
    const positives = [0, 1, 42, 100, 1000, 32767];
    for (const n of positives) {
      expect(bitsToSignedNum(constToBits(n, 16), 16)).toBe(n);
    }
  });

  it("inmediatos negativos en 16 bits sobreviven el roundtrip con signo", () => {
    const negatives = [-1, -4, -100, -1000, -32768];
    for (const n of negatives) {
      expect(bitsToSignedNum(constToBits(n, 16), 16)).toBe(n);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// sliceBits
// ═══════════════════════════════════════════════════════════════════════════
describe("sliceBits", () => {
  describe("instrucción R-type: add $t0, $t1, $t2 = 0x012A4020", () => {
    // bits: 00000001001010100100000000100000
    const bits = hexToBits("0x012A4020");
    const sliced = sliceBits(bits);

    it("extrae opcode = 000000 (SPECIAL)", () => {
      expect(sliced.opcode).toBe("000000");
    });

    it("extrae rs = 01001 ($t1 = registro 9)", () => {
      expect(sliced.rs).toBe("01001");
      expect(bitsToUnsignedNum(sliced.rs)).toBe(9);
    });

    it("extrae rt = 01010 ($t2 = registro 10)", () => {
      expect(sliced.rt).toBe("01010");
      expect(bitsToUnsignedNum(sliced.rt)).toBe(10);
    });

    it("extrae rd = 01000 ($t0 = registro 8)", () => {
      expect(sliced.rd).toBe("01000");
      expect(bitsToUnsignedNum(sliced.rd)).toBe(8);
    });

    it("extrae shamt = 00000", () => {
      expect(sliced.shamt).toBe("00000");
      expect(bitsToUnsignedNum(sliced.shamt)).toBe(0);
    });

    it("extrae funct = 100000 (ADD = 32)", () => {
      expect(sliced.funct).toBe("100000");
      expect(bitsToUnsignedNum(sliced.funct)).toBe(32);
    });
  });

  describe("instrucción I-type: addiu $t0, $zero, 42 = 0x2408002A", () => {
    // bits: 00100100000010000000000000101010
    const bits = hexToBits("0x2408002A");
    const sliced = sliceBits(bits);

    it("extrae opcode = 001001 (ADDIU = 9)", () => {
      expect(sliced.opcode).toBe("001001");
      expect(bitsToUnsignedNum(sliced.opcode)).toBe(9);
    });

    it("extrae rs = 00000 ($zero = registro 0)", () => {
      expect(sliced.rs).toBe("00000");
      expect(bitsToUnsignedNum(sliced.rs)).toBe(0);
    });

    it("extrae rt = 01000 ($t0 = registro 8)", () => {
      expect(sliced.rt).toBe("01000");
      expect(bitsToUnsignedNum(sliced.rt)).toBe(8);
    });

    it("extrae imm16 = 0000000000101010 (= 42)", () => {
      expect(sliced.imm16).toBe("0000000000101010");
      expect(bitsToUnsignedNum(sliced.imm16)).toBe(42);
    });
  });

  describe("instrucción de memoria con offset negativo: lw $s0, -4($sp) = 0x8FB0FFFC", () => {
    // lw $s0, -4($sp)
    const bits = hexToBits("0x8FB0FFFC");
    const sliced = sliceBits(bits);

    it("extrae imm16 que representa -4 en complemento a dos", () => {
      expect(bitsToSignedNum(sliced.imm16, 16)).toBe(-4);
    });

    it("extrae opcode correcto para LW", () => {
      // LW opcode = 100011 = 35
      expect(bitsToUnsignedNum(sliced.opcode)).toBe(35);
    });
  });

  describe("longitudes de todos los campos", () => {
    const sliced = sliceBits("0".repeat(32));

    it("opcode tiene 6 bits", () => expect(sliced.opcode.length).toBe(6));
    it("rs tiene 5 bits", () => expect(sliced.rs.length).toBe(5));
    it("rt tiene 5 bits", () => expect(sliced.rt.length).toBe(5));
    it("rd tiene 5 bits", () => expect(sliced.rd.length).toBe(5));
    it("shamt tiene 5 bits", () => expect(sliced.shamt.length).toBe(5));
    it("funct tiene 6 bits", () => expect(sliced.funct.length).toBe(6));
    it("imm16 tiene 16 bits", () => expect(sliced.imm16.length).toBe(16));
    it("imm21 tiene 21 bits", () => expect(sliced.imm21.length).toBe(21));
    it("imm26 tiene 26 bits", () => expect(sliced.imm26.length).toBe(26));
  });

  describe("solapamiento correcto entre campos", () => {
    // Los campos comparten bits según el formato MIPS:
    // imm16 = rd + shamt + funct  (bits 15-0)
    // imm21 = rt + rd + shamt + funct  (bits 20-0)
    // imm26 = rs + rt + rd + shamt + funct  (bits 25-0)
    const bits = hexToBits("0x012A4020");
    const { rd, shamt, funct, imm16, rt, imm21, rs, imm26 } = sliceBits(bits);

    it("imm16 = rd + shamt + funct", () => {
      expect(imm16).toBe(rd + shamt + funct);
    });

    it("imm21 = rt + rd + shamt + funct", () => {
      expect(imm21).toBe(rt + rd + shamt + funct);
    });

    it("imm26 = rs + rt + rd + shamt + funct", () => {
      expect(imm26).toBe(rs + rt + rd + shamt + funct);
    });
  });
});
