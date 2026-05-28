import type { InstructionArg } from "@/types/instruction.types";
import { OperandExpectation } from "@/types/parser.types";

type RawInstructionArg = string;

const RAW_ARG_TO_CANONICAL_ARG: Readonly<Record<string, InstructionArg>> = {
    rs              : "rs",
    rt              : "rt",
    rd              : "rd",

    shamt           : "shamt",
    sa              : "sa",

    immediate       : "imm16",
    imm16           : "imm16",

    offset          : "offset16",
    offset16        : "offset16",

    "offset(rs)"    : "offsetFromBase",
    "offset(base)"  : "offsetFromBase",
    offsetFromBase  : "offsetFromBase",

    address         : "imm26",
    target          : "imm26",
    imm26           : "imm26",

    imm21           : "imm21",
    "code"          : "code",
};

const INSTRUCTION_ARG_TO_OPERAND_EXPECTATION: Readonly<Record<InstructionArg, OperandExpectation>> = {
    rs                : 'register',
    rt                : 'register',
    rd                : 'register',
    imm16             : 'immediate16s',
    imm26             : 'label',
    imm21             : 'label',
    offset16          : 'label',
    offsetFromBase    : 'memory',
    shamt             : 'shamt5u',
    sa                : 'shamt5u',
    code              : 'immediate16u',
}

function normalizeInstructionArg(rawArg: string): InstructionArg {
    const normalized = RAW_ARG_TO_CANONICAL_ARG[rawArg];

    if (!normalized) {
        throw new Error(`Argumento de instrucción no soportado en la SOT: '${rawArg}'`);
    }

    return normalized;
}

export function getOperandExpectationsFromArg( args: ReadonlyArray<RawInstructionArg> ): ReadonlyArray<OperandExpectation> {
    return args.map(arg => {
        return INSTRUCTION_ARG_TO_OPERAND_EXPECTATION[normalizeInstructionArg(arg)];
    });
}