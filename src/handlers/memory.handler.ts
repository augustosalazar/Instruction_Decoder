import { ENCODING_BY_MNEMONIC } from "@/constants/instructions.constants";
import { RegisterBits, RegisterName } from "@/constants/registers.constants";
import { MEMORY_MNEMONICS } from "@/constants/set.constants";
import { HandlerError, InstructionDescription, InstructionHandler } from "@/types/handler.types";
import { DecodedInstruction } from "@/types/instruction.types";
import { MemoryOperand, RegisterOperand } from "@/types/operand.types";
import { MipsVersion } from "@/types/version.types";
import { bitsToSignedNum, constToBits, sliceBits } from "@/utils/bit.utils";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";

const instructions: ReadonlyArray<InstructionDescription> =
    Object.values(ENCODING_BY_MNEMONIC)
        .filter(e => MEMORY_MNEMONICS.includes(e.mnemonic))
        .map(e => ({ mnemonic: e.mnemonic, opcode: e.opcode }));

export const memoryHandler: InstructionHandler = {
    instructions,
    encode,
    decode
}

function encode(instruction: DecodedInstruction): string {
    const { mnemonic, operands } = instruction;
    const encoded = ENCODING_BY_MNEMONIC[mnemonic];

    if (!encoded)
        throw new HandlerError({ type: 'UNKNOWN_MNEMONIC', message: `[Memory-handler] Encoding no encontrado para ${mnemonic}` })

    // rt, offset(base) es opcode | rs(base) | rt | offset16
    const rt     = regNameToBits((operands[0] as RegisterOperand).name);
    const mem    = operands[1] as MemoryOperand;
    const rs     = regNameToBits(mem.base as RegisterName);
    const offset = constToBits(mem.offset, 16);
 
    return encoded.opcode + rs + rt + offset;
};

function decode(bits32: string, version: MipsVersion): DecodedInstruction {
    const { opcode, rs, rt, imm16 } = sliceBits(bits32);

    const encoded = Object.values(ENCODING_BY_MNEMONIC).find(e =>
        e.opcode === opcode && MEMORY_MNEMONICS.includes(e.mnemonic)
    );

    if (!encoded ) 
        throw new HandlerError({ type:'UNKNOWN_OPCODE', message:`[Mem-handler] opcode desconocido ${opcode}`})
;
    return {
        mnemonic: encoded.mnemonic,
        operands: [
            { kind: 'register', name: regBitsToName(rt as RegisterBits) },
            { kind: 'memory',   base: regBitsToName(rs as RegisterBits), offset: bitsToSignedNum(imm16, 16) },
        ],
    };
};