import type { DecodedInstruction } from "@/types/instruction.types";
import type { ImmediateOperand } from "@/types/operand.types";
import { bitsToSignedNum, constToBits, sliceBits } from "@/utils/bit.utils";
import type { BranchEncodingRule } from "../branch.rules";
import { immediateToOperand } from "@/utils/operands.util";

const MNEMONICS = new Set(["bc", "balc"]);

export const r6CompactJump26Rule = {
    name: "R6-COMPACT-JUMP-26",

    matchesMnemonic(mnemonic: string): boolean {
        return MNEMONICS.has(mnemonic);
    },

    encode(instruction, encoding): string {
        const [offsetOp] = instruction.operands;

        const offset = constToBits(
            (offsetOp as ImmediateOperand).value,
            26,
        );

        return encoding.opcode + offset;
    },

    decode(bits32, encoding): DecodedInstruction {
        const { imm26 } = sliceBits(bits32);

        return {
            mnemonic: encoding.mnemonic,
            operands: [
                immediateToOperand(bitsToSignedNum(imm26, 26)),
            ],
        };
    },
} satisfies BranchEncodingRule;