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

export type BranchMnemonic =
  | 'beq' | 'bne' | 'blez' | 'bgtz'
  | 'bltz'| 'bgez'| 'bal'

export type JTypeMnemonic =
  | 'j' | 'jal' | 'bc' | 'balc'

export type Mnemonic =
  | RTypeMnemonic
  | ITypeMnemonic
  | MemoryMnemonic
  | BranchMnemonic
  | JTypeMnemonic