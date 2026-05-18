import type { DecodedInstruction } from "@/types/instruction.types";
import type { Operand }            from "@/types/operand.types";

const formatOperand = (op: Operand): string => {
    switch (op.kind) {
        case 'register':  return `$${op.name}`;
        case 'immediate': return op.value.toString();
        case 'memory':    return `${op.offset}($${op.base})`;
    }
};

export const formatDecodedInstruction = (instruction: DecodedInstruction): string =>
    [instruction.mnemonic, ...instruction.operands.map(formatOperand)].join(' ');