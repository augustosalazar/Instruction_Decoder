import { BRANCH_MNEMONICS, JUMP_MNEMONICS } from "@/constants/set.constants";

export type RTypeMnemonic =
  | 'add' | 'addu' | 'sub' | 'subu'
  | 'and' | 'or'   | 'xor' | 'nor'
  | 'slt' | 'sltu'

export type ITypeMnemonic =
  | 'addiu' | 'addi'
  | 'slti'  | 'sltiu'
  | 'andi'  | 'ori' | 'xori'

export type MemoryMnemonic =
  | 'lw' | 'sw'

export type BranchMnemonic = typeof BRANCH_MNEMONICS[number];
export type JTypeMnemonic  = typeof JUMP_MNEMONICS[number];

export type Mnemonic =
  | RTypeMnemonic
  | ITypeMnemonic
  | MemoryMnemonic
  | BranchMnemonic
  | JTypeMnemonic