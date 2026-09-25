/** Small deterministic string hash (FNV-1a), used to seed generated artwork. */
export function hash(input: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Aliases worth showing: drops ones that only differ from the name by case or punctuation. */
export function distinctAliases(name: string, aliases: string[]): string[] {
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
  return aliases.filter((a) => norm(a) !== norm(name))
}
