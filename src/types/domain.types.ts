import { RegisterName } from "@/constants/registers.constants"

export type HexValue = `0x${number}` | `0x${string}`
export type RegToken = `$${RegisterName}`