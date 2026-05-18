import { RegisterBits } from "@/constants/registers.constants";
import type { BranchEncodingRule } from "../branch.rules";
import type { RegisterOperand, ImmediateOperand } from "@/types/operand.types";
import { bitsToSignedNum, constToBits, sliceBits } from "@/utils/bit.utils";
import { immediateToOperand, regToOperand } from "@/utils/operands.util";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";

const MNEMONICS = new Set([
    "beqc", "bnec", "bltc", "bgec",
    "bltuc", "bgeuc", "bovc", "bnvc",
]);

export const r6TwoRegBranchRule = {
    name: "R6-TWO-REG-BRANCH",

    matchesMnemonic(mnemonic: string): boolean {
        return MNEMONICS.has(mnemonic);
    },

    encode(instruction, encoding) {
        const [rsOp, rtOp, offsetOp] = instruction.operands;

        const rs        = regNameToBits((rsOp as RegisterOperand).name);
        const rt        = regNameToBits((rtOp as RegisterOperand).name);
        const offset    = constToBits((offsetOp as ImmediateOperand).value, 16);

        return encoding.opcode + rs + rt + offset;
    },

    decode(bits32, encoding) {
        const { rs, rt, imm16 } = sliceBits(bits32);

        return {
            mnemonic: encoding.mnemonic,
            operands: [
                regToOperand(regBitsToName(rs as RegisterBits)),
                regToOperand(regBitsToName(rt as RegisterBits)),
                immediateToOperand(bitsToSignedNum(imm16, 16)),
            ],
        };
    },
} satisfies BranchEncodingRule;