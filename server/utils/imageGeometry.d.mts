/** 見 imageGeometry.mjs。吃絕對路徑，量不到回 null。 */
export function ratioOf (abs: string): Promise<number | null>
export function focalOf (abs: string): Promise<{ focalX: number, focalY: number } | null>
