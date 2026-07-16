/** @deprecated 猫已并入 town store；保留空壳避免旧 import 报错 */
export function useCatGridWalker(startRow: number, startCol: number, _seed: string) {
  return { row: startRow, col: startCol }
}
