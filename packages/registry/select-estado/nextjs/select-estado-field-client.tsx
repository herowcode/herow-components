"use client";

import * as React from "react";
import { useFormContext, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SelectEstadoClient } from "./select-estado-client";

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface SelectEstadoFieldClientProps<T extends FieldValues> {
  name: FieldPath<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  estados: Estado[];
}

export function SelectEstadoFieldClient<T extends FieldValues>({
  name,
  label,
  description,
  placeholder,
  disabled,
  className,
  estados,
}: SelectEstadoFieldClientProps<T>) {
  const form = useFormContext<T>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <SelectEstadoClient
              value={field.value}
              onValueChange={field.onChange}
              placeholder={placeholder}
              disabled={disabled}
              estados={estados}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
