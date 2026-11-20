import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// O MIFT importa cn do pacote "cn"; no starter ele mora aqui (alias @/lib/utils, padrão do shadcn).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
