import { Loader2 } from "lucide-react"
import * as React from "react"
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form"

import { getCidades } from "@/actions/select-cidade"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { InputGroupAddon } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

// Module-level cache for cidades by state
const cidadesCache = new Map<string, string[]>()
const cidadesFetchPromises = new Map<string, Promise<string[]>>()

async function fetchCidadesWithCache(state: string): Promise<string[]> {
  const cached = cidadesCache.get(state)
  if (cached) return cached

  let promise = cidadesFetchPromises.get(state)
  if (!promise) {
    promise = getCidades(state)
      .then((response) => {
        const options = response.map((cidade) => cidade.nome)
        cidadesCache.set(state, options)
        cidadesFetchPromises.delete(state)
        return options
      })
      .catch((error) => {
        cidadesFetchPromises.delete(state)
        throw error
      })
    cidadesFetchPromises.set(state, promise)
  }

  return promise
}

interface ISelectCidadeProps {
  value?: string
  onValueChange?: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  showClear?: boolean
  state: string | null
}

export function SelectCidade({
  value,
  onValueChange,
  placeholder = "Selecione uma cidade...",
  disabled = false,
  invalid = false,
  className,
  showClear = false,
  state,
}: ISelectCidadeProps) {
  const [cidadesOptions, setCidadesOptions] = React.useState<string[]>(
    () => (state ? cidadesCache.get(state) ?? [] : []),
  )
  const [loading, setLoading] = React.useState(
    () => !!state && !cidadesCache.has(state),
  )
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!state) {
      setCidadesOptions([])
      setLoading(false)
      return
    }

    const cached = cidadesCache.get(state)
    if (cached) {
      setCidadesOptions(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchCidadesWithCache(state)
      .then((options) => {
        if (!cancelled) {
          setCidadesOptions(options)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Erro ao carregar cidades")
          setLoading(false)
          console.error(err)
        }
      })

    return () => {
      cancelled = true
    }
  }, [state])

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center h-10 px-3 border border-destructive rounded-md",
          className,
        )}
      >
        <span className="text-destructive">{error}</span>
      </div>
    )
  }

  return (
    <Combobox
      items={cidadesOptions}
      value={value ?? ""}
      onValueChange={onValueChange}
    >
      <ComboboxInput
        placeholder={loading ? "Carregando..." : placeholder}
        showClear={showClear}
        disabled={disabled || loading}
        aria-invalid={invalid ? "true" : undefined}
        className={cn("h-9", className)}
      >
        {loading && (
          <InputGroupAddon>
            <Loader2 className="size-4 animate-spin" />
          </InputGroupAddon>
        )}
      </ComboboxInput>
      <ComboboxContent>
        <ComboboxEmpty>Nenhuma cidade encontrada.</ComboboxEmpty>
        <ComboboxList className="max-h-[30vh] w-full">
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export const SelectCidadeForm = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label = "Cidade",
  helper,
  required,
  readOnly,
  className,
  posLabel,
  disabled,
  state,
  ...props
}: Omit<ControllerProps<TFieldValues, TName>, "render"> & {
  label?: string
  className?: string
  required?: boolean
  readOnly?: boolean
  helper?: string | React.ReactNode
  posLabel?: React.ReactNode
  state: string | null
}) => {
  return (
    <FormField
      {...props}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <div className="flex items-center">
            {label && (
              <FormLabel>
                {label}
                {required && <span className="text-rose-600">*</span>}
              </FormLabel>
            )}
            {posLabel}
          </div>
          <FormControl>
            <SelectCidade
              value={field.value}
              onValueChange={field.onChange}
              disabled={readOnly || disabled}
              invalid={!!fieldState.error}
              state={state}
            />
          </FormControl>
          {helper && typeof helper === "string" && (
            <FormDescription>{helper}</FormDescription>
          )}
          {helper && typeof helper !== "string" && helper}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
