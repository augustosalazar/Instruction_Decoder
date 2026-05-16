export const FUNCT = {
  // Aritmeticológicas
  ADD:     '100000',
  ADDU:    '100001',
  SUB:     '100010',
  SUBU:    '100011',
  AND:     '100100',
  OR:      '100101',
  XOR:     '100110',
  NOR:     '100111',
  SLT:     '101010',
  SLTU:    '101011',

  // Shift?
  SLL:     '000000',
  SRL:     '000010',
  SRA:     '000011',
  SLLV:    '000100',
  SRLV:    '000110',
  SRAV:    '000111',

  // Jump
  JR:      '001000',
  JALR:    '001001',

  // Sistema
  SYSCALL: '001100',
  BREAK:   '001101',

  /**
   * Multiplicar y dividir..
   *    Es tricky, para legacy, se omite el uso de SHAMT,
   *    Para R6, se usa SHAMT, visto en este code como SHAMT_R6
  **/
  MULT:    '011000',   // legacy
  MUL:     '011000',
  MUH:     '011000',
  MULTU:   '011001',   // legacy
  MULU:    '011001',
  MUHU:    '011001',
  DIV:     '011010',
  DIVU:    '011011',
  MOD:     '011010',
  MODU:    '011011',

  // Exclusivas R6
  LSA:     '000101',
  SELEQZ:  '110101',
  SELNEZ:  '110111',

  // Legacy
  TGE:     '110000',
  TGEU:    '110001',
  TLT:     '110010',
  TLTU:    '110011',
  TEQ:     '110100',
  TNE:     '110110',

  MFHI:    '010000',
  MTHI:    '010001',
  MFLO:    '010010',
  MTLO:    '010011',

} as const;

export type Funct = typeof FUNCT[keyof typeof FUNCT];

// Shamt para instrucciones R6 que lo usan como discriminador.
export const SHAMT_R6 = {
  MUL:  '00010',
  MUH:  '00011',
  MULU: '00010',
  MUHU: '00011',
  DIV:  '00010',
  MOD:  '00011',
  DIVU: '00010',
  MODU: '00011',
} as const;

export type Shamt = typeof SHAMT_R6[keyof typeof SHAMT_R6];