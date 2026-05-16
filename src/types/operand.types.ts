export type RegisterOperand = {
    readonly kind   : 'register';
    readonly bits   : string;
}

export type ImmediateOperand = {
    readonly kind   : 'immediate';
    readonly value  : number;
}

export type MemoryOperand = {
    readonly kind   : 'memory';
    readonly base   : string;
    readonly offset : number;
}

export type Operand = RegisterOperand | ImmediateOperand | MemoryOperand;

