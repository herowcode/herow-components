import { getEstados } from "@/actions/select-estado";
import { SelectEstadoClient } from "./select-estado-client";

export interface SelectEstadoProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Estados pré-carregados (opcional - se não fornecido, busca automaticamente) */
  estados?: Array<{ id: number; sigla: string; nome: string }>;
}

/**
 * SelectEstado - Server Component
 *
 * Busca os estados no servidor e renderiza o componente cliente.
 * Use este componente em Server Components (pages, layouts).
 *
 * Para uso em Client Components, importe SelectEstadoClient diretamente
 * e passe os estados como prop.
 */
export async function SelectEstado(props: SelectEstadoProps) {
  // Se estados foram passados como prop, usa eles
  if (props.estados) {
    return <SelectEstadoClient {...props} estados={props.estados} />;
  }

  // Caso contrário, busca no servidor
  const estados = await getEstados();
  return <SelectEstadoClient {...props} estados={estados} />;
}

// Re-exporta o cliente para uso direto quando necessário
export { SelectEstadoClient } from "./select-estado-client";
