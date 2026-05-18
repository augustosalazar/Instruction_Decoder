export const OPCODES = {
    SPECIAL           : '000000',
    REGIMM            : '000001',

    // Jump
    J                 : '000010',
    JAL               : '000011',

    // Branch
    BEQ               : '000100',
    BNE               : '000101',
    BLEZ              : '000110',
    BGTZ              : '000111',

    // Tipo I
    ADDI              : '001000',
    ADDIU             : '001001',
    SLTI              : '001010',
    SLTIU             : '001011',
    ANDI              : '001100',
    ORI               : '001101',
    XORI              : '001110',
    LUI               : '001111',

    // Memoria
    LB                : '100000',
    LH                : '100001',
    LW                : '100011',
    LBU               : '100100',
    LHU               : '100101',
    SB                : '101000',
    SH                : '101001',
    SW                : '101011',

    // R6
    AUI               : '001111',
    BC                : '110010',
    BALC              : '111010',
    BEQZC             : '110110',
    BNEZC             : '111110',
} as const;


export const REGIMM = {
    BLTZ:    "00000",
    BGEZ:    "00001",
    
    BLTZAL:  "10000",
    BGEZAL:  "10001",
    
    NAL:     "10000",
    BAL:     "10001",
} as const;

export type Opcode    = typeof OPCODES[keyof typeof OPCODES];
export type Regimm = typeof REGIMM[keyof typeof REGIMM];