export type ParseResult = {
  readonly instructions : ReadonlyArray<string>;
  readonly errors       : ReadonlyArray<string>;
};

export type LabelInfo = {
  readonly name       : string;
  readonly address    : number;
  readonly lineNumber : number;
};

export type ParsedLine = {
  readonly lineNumber           : number;
  readonly label                : string | null;
  readonly mnemonic             : string;
  readonly rawOperands          : ReadonlyArray<string>;
};

export type ValidatedOperand =
  | { readonly kind: 'register';  readonly name: string                                    }
  | { readonly kind: 'immediate'; readonly value: number                                   }
  | { readonly kind: 'label';     readonly name: string                                    }
  | { readonly kind: 'memory';    readonly offset: number; readonly base: string           };

export type ValidatedInstruction = {
  readonly lineNumber : number;
  readonly address    : number;
  readonly mnemonic   : string;
  readonly operands   : ReadonlyArray<ValidatedOperand>;
};

export type OperandExpectation =
  | 'register'
  | 'immediate16s'
  | 'immediate16u'
  | 'shamt5u'
  | 'label'
  | 'memory';