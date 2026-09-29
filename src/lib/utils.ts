export function cn(...values: Array<string | undefined | null | false>) {
  return values.filter(Boolean).join(" ");
}

export function formatPersonName(name: string) {
  return name.replace(/\bDr\.(?=\S)/gi, "Dr. ");
}
