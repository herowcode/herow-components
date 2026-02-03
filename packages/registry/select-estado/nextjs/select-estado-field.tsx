import { getEstados } from "@/actions/select-estado";
import { SelectEstadoFieldClient } from "./select-estado-field-client";

interface SelectEstadoFieldProps {
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * SelectEstadoField - Server Component para uso com React Hook Form
 *
 * Busca os estados no servidor e renderiza o campo de formulário.
 */
export async function SelectEstadoField(props: SelectEstadoFieldProps) {
  const estados = await getEstados();
  return <SelectEstadoFieldClient {...props} estados={estados} />;
}

export { SelectEstadoFieldClient } from "./select-estado-field-client";
