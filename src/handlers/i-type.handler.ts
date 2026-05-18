import { ENCODING_BY_MNEMONIC } from "@/constants/instructions.constants";
import { REG_ZERO, RegisterBits } from "@/constants/registers.constants";
import { I_TYPE_MNEMONICS } from "@/constants/set.constants";
import { HandlerError, InstructionDescription, InstructionHandler } from "@/types/handler.types";
import { DecodedInstruction } from "@/types/instruction.types";
import { ImmediateOperand, RegisterOperand } from "@/types/operand.types";
import { MipsVersion } from "@/types/version.types";
import { constToBits, sliceBits } from "@/utils/bit.utils";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";

const instructions: ReadonlyArray<InstructionDescription> =
    Object.values(ENCODING_BY_MNEMONIC)
        .filter(e => I_TYPE_MNEMONICS.includes(e.mnemonic))
        .map(e => ({ mnemonic: e.mnemonic, opcode: e.opcode }));

export const iTypeHandler: InstructionHandler = {
    instructions,
    encode,
    decode
}

function encode(instruction: DecodedInstruction): string {
    const { mnemonic, operands } = instruction;
    const encoded = ENCODING_BY_MNEMONIC[mnemonic];

    if (!encoded)
        throw new HandlerError({ type: 'UNKNOWN_MNEMONIC', message: `[I-type-handler] Encoding no encontrado para ${mnemonic}` })

    if (mnemonic === 'lui') {
        const rt = regNameToBits((operands[0] as RegisterOperand).name);
        const immediate = constToBits((operands[1] as ImmediateOperand).value, 16);
        return encoded.opcode + REG_ZERO + rt + immediate;
    }

    const rt = regNameToBits((operands[0] as RegisterOperand).name);
    const rs = regNameToBits((operands[1] as RegisterOperand).name);
    const imm = constToBits((operands[2] as ImmediateOperand).value, 16);
    return encoded.opcode + rs + rt + imm;
}

function decode(bits32: string, version: MipsVersion): DecodedInstruction {
    const { opcode, rs, rt, imm16 } = sliceBits(bits32);

    const encoded = Object.values(ENCODING_BY_MNEMONIC).find(e =>
        e.opcode === opcode && I_TYPE_MNEMONICS.includes(e.mnemonic)
    );

    if (!encoded ) 
        throw new HandlerError({ type:'UNKNOWN_MNEMONIC', message:`[I-type-handler] opcode desconocido ${opcode}`})
;
    // lui es AUI con rs=00000
    const mnemonic = (encoded .mnemonic === 'aui' && rs === REG_ZERO) ? 'lui' : encoded .mnemonic;

    if (mnemonic === 'lui')
        return {
            mnemonic: 'lui',
            operands: [
                { kind: 'register', name: regBitsToName(rt as RegisterBits) },
                { kind: 'immediate', value: parseInt(imm16, 2) },
            ],
        };

    return {
        mnemonic,
        operands: [
            { kind: 'register', name: regBitsToName(rt as RegisterBits) },
            { kind: 'register', name: regBitsToName(rs as RegisterBits) },
            { kind: 'immediate', value: parseInt(imm16, 2) },
        ],
    };
};