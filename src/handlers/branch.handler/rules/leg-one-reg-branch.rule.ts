import type { DecodedInstruction } from "@/types/instruction.types";
import type { ImmediateOperand, RegisterOperand } from "@/types/operand.types";
import { REG_ZERO, type RegisterBits } from "@/constants/registers.constants";
import { bitsToSignedNum, constToBits, sliceBits} from "@/utils/bit.utils";
import { immediateToOperand, regToOperand} from "@/utils/operands.util";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";
import type { BranchEncodingRule } from "../branch.rules";

const MNEMONICS = new Set(["blez","bgtz"]);

export const legOneRegBranchRule = {
    name: "LEG-ONE-REG-BRANCH",

    matchesMnemonic(mnemonic: string): boolean {
        return MNEMONICS.has(mnemonic);
    },

    encode(instruction, encoding): string {
        const [rsOp, offsetOp] = instruction.operands;

        const rs = regNameToBits((rsOp as RegisterOperand).name);

        const offset = constToBits(
            (offsetOp as ImmediateOperand).value,
            16,
        );

        return encoding.opcode + rs + REG_ZERO + offset;
    },

    decode(bits32, encoding): DecodedInstruction {
        const { rs, rt, imm16 } = sliceBits(bits32);

        if (rt !== REG_ZERO) {
            throw new Error(
                `[LEG-ONE-REG-BRANCH] rt inválido para '${encoding.mnemonic}': '${rt}'`,
            );
        }

        return {
            mnemonic: encoding.mnemonic,
            operands: [
                regToOperand(regBitsToName(rs as RegisterBits)),
                immediateToOperand(bitsToSignedNum(imm16, 16)),
            ],
        };
    },
} satisfies BranchEncodingRule;