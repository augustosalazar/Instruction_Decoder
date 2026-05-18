import type { DecodedInstruction } from "@/types/instruction.types";
import type { ImmediateOperand, RegisterOperand } from "@/types/operand.types";
import { OPCODES, REGIMM } from "@/constants/opcodes.constants";
import { REG_ZERO, type RegisterBits } from "@/constants/registers.constants";
import { bitsToSignedNum,constToBits, sliceBits } from "@/utils/bit.utils";
import { immediateToOperand, regToOperand } from "@/utils/operands.util";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";
import type { BranchEncodingRule } from "../branch.rules";

const REGIMM_BY_MNEMONIC: Readonly<Record<string, string>> = {
    bltz: REGIMM.BLTZ,
    bgez: REGIMM.BGEZ,
    bal: REGIMM.BAL,
    nal: REGIMM.NAL,
};

const MNEMONICS = new Set(Object.keys(REGIMM_BY_MNEMONIC));

function findMnemonicByRt(rt: string): string | null {
    return (
        Object.entries(REGIMM_BY_MNEMONIC)
            .find(([, rtField]) => rtField === rt)?.[0] ?? null
    );
}

export const legRegimmBranchRule = {
    name: "LEG-REGIMM-BRANCH",

    matchesMnemonic(mnemonic: string): boolean {
        return MNEMONICS.has(mnemonic);
    },

    encode(instruction, encoding): string {
        const { mnemonic, operands } = instruction;

        const rtField = REGIMM_BY_MNEMONIC[mnemonic];

        if (!rtField)
            throw new Error(`[LEG-REGIMM-BRANCH] mnemonic no soportado '${mnemonic}'`);

        if (mnemonic === "nal")
            return OPCODES.REGIMM + REG_ZERO + rtField + constToBits(0, 16);

        if (mnemonic === "bal") {
            const [offsetOp] = operands;

            const offset = constToBits(
                (offsetOp as ImmediateOperand).value,
                16,
            );

            return OPCODES.REGIMM + REG_ZERO + rtField + offset;
        }

        const [rsOp, offsetOp] = operands;

        const rs = regNameToBits((rsOp as RegisterOperand).name);
        const offset = constToBits((offsetOp as ImmediateOperand).value, 16);

        return OPCODES.REGIMM + rs + rtField + offset;
    },

    decode(bits32, encoding): DecodedInstruction {
        const { opcode, rs, rt, imm16 } = sliceBits(bits32);

        if (opcode !== OPCODES.REGIMM)
            throw new Error(`[LEG-REGIMM-BRANCH] opcode inválido '${opcode}'`);

        const mnemonic = findMnemonicByRt(rt);

        if (!mnemonic)
            throw new Error(`[LEG-REGIMM-BRANCH] rt desconocido '${rt}'`);

        if (mnemonic === "nal") {
            return {
                mnemonic,
                operands: [],
            };
        }

        const offset = bitsToSignedNum(imm16, 16);

        if (mnemonic === "bal") {
            return {
                mnemonic,
                operands: [
                    immediateToOperand(offset),
                ],
            };
        }

        return {
            mnemonic,
            operands: [
                regToOperand(regBitsToName(rs as RegisterBits)),
                immediateToOperand(offset),
            ],
        };
    },

} satisfies BranchEncodingRule;