import type { DecodedInstruction } from "@/types/instruction.types";
import type { ImmediateOperand, RegisterOperand } from "@/types/operand.types";
import { REG_ZERO, type RegisterBits } from "@/constants/registers.constants";
import { bitsToSignedNum, constToBits, sliceBits} from "@/utils/bit.utils";
import type { BranchEncodingRule } from "../branch.rules";
import { regBitsToName, regNameToBits } from "@/utils/register.utils";
import { immediateToOperand, regToOperand } from "@/utils/operands.util";

const MNEMONICS = new Set(["jic", "jialc"]);

export const r6IndexedJump16Rule = {
    name: "R6-INDEXED-JUMP-16",

    matchesMnemonic(mnemonic: string): boolean {
        return MNEMONICS.has(mnemonic);
    },

    encode(instruction, encoding): string {
        const [rtOp, offsetOp] = instruction.operands;

        const rt = regNameToBits((rtOp as RegisterOperand).name);

        const offset = constToBits(
            (offsetOp as ImmediateOperand).value,
            16,
        );

        return encoding.opcode + REG_ZERO + rt + offset;
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