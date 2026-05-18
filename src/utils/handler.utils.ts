import { ENCODING_BY_MNEMONIC } from "@/constants/instructions.constants";
import { HandlerError, InstructionDescription } from "@/types/handler.types";
import { InstructionEncoding } from "@/types/instruction.types";

// Funcion que permite extraer del set general dada una condicion 
export function buildInstructionDescriptions(predicate: (encoding: InstructionEncoding) => boolean)
    : ReadonlyArray<InstructionDescription> {

    return Object.values(ENCODING_BY_MNEMONIC)
        .filter(predicate)
        .map(e => ({ mnemonic: e.mnemonic, opcode: e.opcode }));
}

export function getEncoding(mnemonic: string, handlerName: string): InstructionEncoding {
    const encoding = ENCODING_BY_MNEMONIC[mnemonic];
    
    if (!encoding)
        throw new HandlerError({ type: "UNKNOWN_MNEMONIC", message: `[${handlerName}] Encoding no encontrado para ${mnemonic}`});

    return encoding;
}

export function findEncodingByOpcode( opcode: string, predicate: (encoding: InstructionEncoding) => boolean, handlerName: string ): InstructionEncoding {
    const encoding = Object.values(ENCODING_BY_MNEMONIC).find(
        e => e.opcode === opcode && predicate(e),
    );
    
    if (!encoding)
        throw new HandlerError({ type: "UNKNOWN_OPCODE", message: `[${handlerName}] opcode desconocido ${opcode}`});

    return encoding;
}