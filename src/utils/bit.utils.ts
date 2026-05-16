import { HexValue } from "@/types/domain.types";

export const hexToBits = (hex: string): string => {
    return hex
        .replace(/^0x/i, '') // Extraer, usando el regex, el prefix '0x'
        .split('')
        .map(h => parseInt(h, 16).toString(2).padStart(4, '0'))
        .join('');
}

export const bitsToHex = (bits: string): HexValue => {
    let b = bits;
    while (b.length % 4 !== 0)
        b = '0' + b;

    let hex = '';
    for (let i = 0; i < b.length; i += 4)
        hex = hex + parseInt(b.slice(i, i + 4), 2).toString(16);

    return `0x${hex.toUpperCase()}`
}

export const constToBits = (value: number, width: number): string => {
    return (value >>> 0).toString(2).padStart(width, '0').slice(-(width));
}

export const bitsToUnsignedNum = (bits: string): number => {
    return parseInt(bits, 2);
}

export const bitsToSignedNum = (bits: string, width: number): number => {
    const raw = parseInt(bits, 2);
    const signBit = 1 << (width - 1);
    return raw >= signBit ? raw - (signBit << 1) : raw;
};

// Esta es la funcion del decoder del procesador, split de bits.
export const sliceBits = (bits32: string) => ({
    opcode    : bits32.slice(0, 6),
    rs        : bits32.slice(6, 11),
    rt        : bits32.slice(11, 16),
    rd        : bits32.slice(16, 21),
    shamt     : bits32.slice(21, 26),
    funct     : bits32.slice(26, 32),
    imm16     : bits32.slice(16, 32),
    imm21     : bits32.slice(11, 32),
    imm26     : bits32.slice(6, 32),
});

