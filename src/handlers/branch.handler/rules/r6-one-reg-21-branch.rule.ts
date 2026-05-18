import type { DecodedInstruction } from "@/types/instruction.types";
import type { ImmediateOperand, RegisterOperand } from "@/types/operand.types";
import { bitsToSignedNum, constToBits, sliceBits } from "@/utils/bit.utils";
import type { BranchEncodingRule } from "../branch.rules";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";
import { immediateToOperand, regToOperand } from "@/utils/operands.util";
import { RegisterBits } from "@/constants/registers.constants";

const MNEMONICS = new Set(["beqzc", "bnezc"]);

export const r6OneReg21BranchRule = {
    name: "R6-ONE-REG-21-BRANCH",

    matchesMnemonic(mnemonic: string): boolean {
        return MNEMONICS.has(mnemonic);
    },

    encode(instruction, encoding): string {
        const [rsOp, offsetOp] = instruction.operands;

        const rs = regNameToBits((rsOp as RegisterOperand).name);
        const offset = constToBits((offsetOp as ImmediateOperand).value, 21);

        return encoding.opcode + rs + offset;
    },

    decode(bits32, encoding): DecodedInstruction {
        const { rs, imm21 } = sliceBits(bits32);

        return {
            mnemonic: encoding.mnemonic,
            operands: [
                regToOperand(regBitsToName(rs as RegisterBits)),
                immediateToOperand(bitsToSignedNum(imm21, 21)),
            ],
        };
    },
} satisfies BranchEncodingRule;