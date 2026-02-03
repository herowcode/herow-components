"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface SelectEstadoClientProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  estados: Estado[];
}

/**
 * SelectEstadoClient - Client Component
 *
 * Componente de UI puro que recebe os estados como prop.
 * Use quando precisar de controle total ou em Client Components.
 */
export function SelectEstadoClient({
  value,
  onValueChange,
  placeholder = "Selecione um estado...",
  disabled = false,
  className,
  estados,
}: SelectEstadoClientProps) {
  return (
    <Combobox
      items={estados}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className={className}
    >
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>Nenhum estado encontrado.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.sigla} value={item.sigla}>
              {item.nome} ({item.sigla})
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
