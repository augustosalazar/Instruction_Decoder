import type { DecodedInstruction } from "@/types/instruction.types";
import type { ImmediateOperand, RegisterOperand } from "@/types/operand.types";
import { bitsToSignedNum, constToBits, sliceBits } from "@/utils/bit.utils";
import type { BranchEncodingRule } from "../branch.rules";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";
import { immediateToOperand, regToOperand } from "@/utils/operands.util";
import { RegisterBits } from "@/constants/registers.constants";

const MNEMONICS = new Set(["beqzc","bnezc","jic","jialc"]);

export const r6OneReg16BranchRule = {
    name: "R6-ONE-REG-16-BRANCH",

    matchesMnemonic(mnemonic: string): boolean {
        return MNEMONICS.has(mnemonic);
    },

    encode(instruction, encoding): string {
        const [rtOp, offsetOp] = instruction.operands;

        const rt        = regNameToBits((rtOp as RegisterOperand).name);
        const offset    = constToBits((offsetOp as ImmediateOperand).value, 16);

        return encoding.opcode + rt + rt + offset;
    },

    decode(bits32, encoding): DecodedInstruction {
        const { rt, imm16 } = sliceBits(bits32);

        return {
            mnemonic: encoding.mnemonic,
            operands: [
                regToOperand(regBitsToName(rt as RegisterBits)),
                immediateToOperand(bitsToSignedNum(imm16, 16)),
            ],
        };
    },
} satisfies BranchEncodingRule;