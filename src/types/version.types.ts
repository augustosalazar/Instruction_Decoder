// Nombre en runtime
export type MipsVersion = 'legacy' | 'r6';

// Identificados de los datos raw
export type RawVersion = 'MIPS I' | 'MIPS II' | 'MIPS III' | 'MIPS IV' | 'MIPS V' | 'MIPS R6'

export const VERSION_MAP: Readonly<Record<RawVersion, MipsVersion>> = {
    'MIPS I': 'legacy',
    'MIPS II': 'legacy',
    'MIPS III': 'legacy',
    'MIPS IV': 'legacy',
    'MIPS V': 'legacy',
    'MIPS R6': 'r6',
} as const;

export const parseVersion = (raw: string): MipsVersion => {
    const mapped = VERSION_MAP[raw as RawVersion];
    if (!mapped) throw new Error(`Version desconocida: "${raw}"`);
    return mapped;
};