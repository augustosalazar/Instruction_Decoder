import { ENCODING_BY_MNEMONIC } from "@/constants/instructions.constants";
import { ValidatedOperand } from "@/types/parser.types";

// assembly-parser.service.ts[:440]
export function formatOperand(operand: ValidatedOperand): string {
    switch (operand.kind) {
        case 'register': return `$${operand.name}`;
        case 'immediate': return operand.value.toString();
        case 'label': return operand.name;
        case 'memory': return `${operand.offset} $${operand.base}`;
    }
}

const R_TYPE_BINARY_ORDER: Record<string, number[]> = {
    'rd rs rt': [1, 2, 0],   // en sintaxis es [rd, rs, rt] en binario es: [rs, rt, rd]
    'rd rt rs': [2, 1, 0],   // en sintaxis es [rd, rt, rs] en binario es: [rs, rt, rd]
    'rd rt sa': [1, 0, 2],   // en sintaxis es [rd, rt, sa] en binario es: [rt, sa]
};

// Esto no estaba en el legacy, el orden se manejaba por escritura en memoria.
function reorder(mnemonic: string,operands: ReadonlyArray<ValidatedOperand>): ReadonlyArray<ValidatedOperand> {
    const encoding = ENCODING_BY_MNEMONIC[mnemonic];
    if (encoding?.type !== 'R') return operands;
    
    const order = R_TYPE_BINARY_ORDER[encoding.args.join(' ')];
    if (!order) return operands;

    return order.map(i => operands[i]!);
}

export function formatInstruction(mnemonic: string, operands: ReadonlyArray<ValidatedOperand>): string {
    return [mnemonic, ...reorder(mnemonic, operands).map(formatOperand)].join(' ').trim();
}