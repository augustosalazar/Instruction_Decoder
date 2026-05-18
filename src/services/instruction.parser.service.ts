import type { DecodedInstruction } from "@/types/instruction.types";
import type { Operand }            from "@/types/operand.types";
import { ENCODING_BY_MNEMONIC }    from "@/constants/instructions.constants";
import { HandlerError }            from "@/types/handler.types";
import { tokenToOperand } from "@/utils/operands.util";

// Este servicio toma la salida del assembly-parser y limpia los tokens
export const parseInstruction = (line: string): DecodedInstruction => {
    const tokens  = line.trim().split(/\s+/);
    const mnemonic = tokens[0]?.toLowerCase();

    if (!mnemonic)
        throw new HandlerError({type: "UNKNOWN_MNEMONIC", message: "Línea vacía."});
    
    const encoded = ENCODING_BY_MNEMONIC[mnemonic];

    if (!encoded)
        throw new HandlerError({type:'UNKNOWN_MNEMONIC', message: `Instrucción desconocida: '${mnemonic}'`});

    const operands: Operand[] = [];
    let i = 1;

    while (i < tokens.length) {
        const current = tokens[i];
        if (!current) break;

        const { operand, consumed } = tokenToOperand(current, tokens[i + 1]);
        operands.push(operand);
        i += consumed;
    }

    return { mnemonic, operands };
};

export const parseInstructions = (lines: ReadonlyArray<string>): DecodedInstruction[] => lines.map(parseInstruction);