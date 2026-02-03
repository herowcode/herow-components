import { Loader2 } from "lucide-react"
import * as React from "react"
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form"

import { getEstados } from "@/actions/select-estado"
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

interface IEstadoOption {
  label: string
  value: string
}

// Module-level cache for estados (static data)
let estadosCache: IEstadoOption[] | null = null
let estadosFetchPromise: Promise<IEstadoOption[]> | null = null

async function fetchEstadosWithCache(): Promise<IEstadoOption[]> {
  if (estadosCache) return estadosCache

  if (!estadosFetchPromise) {
    estadosFetchPromise = getEstados()
      .then((response) => {
        const options = response.map((estado) => ({
          label: `${estado.nome} (${estado.sigla})`,
          value: estado.sigla,
        }))
        estadosCache = options
        return options
      })
      .catch((error) => {
        estadosFetchPromise = null
        throw error
      })
  }

  return estadosFetchPromise
}

interface ISelectEstadoProps {
  value?: string
  onValueChange?: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  className?: string
  showClear?: boolean
}

export function SelectEstado({
  value,
  onValueChange,
  placeholder = "Selecione um estado...",
  disabled = false,
  invalid = false,
  className,
  showClear = false,
}: ISelectEstadoProps) {
  const [estadosOptions, setEstadosOptions] = React.useState<IEstadoOption[]>(
    () => estadosCache ?? [],
  )
  const [loading, setLoading] = React.useState(() => !estadosCache)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (estadosCache) return

    let cancelled = false

    fetchEstadosWithCache()
      .then((options) => {
        if (!cancelled) {
          setEstadosOptions(options)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError("Erro ao carregar estados")
          setLoading(false)
          console.error(err)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectedOption = React.useMemo(
    () => estadosOptions.find((opt) => opt.value === value) ?? null,
    [estadosOptions, value],
  )

  const handleValueChange = React.useCallback(
    (option: IEstadoOption | null) => {
      onValueChange?.(option?.value ?? null)
    },
    [onValueChange],
  )

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
      items={estadosOptions}
      itemToStringValue={(estado: IEstadoOption) => estado.label}
      value={selectedOption}
      onValueChange={handleValueChange}
      autoHighlight
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
        <ComboboxEmpty>Nenhum estado encontrado.</ComboboxEmpty>
        <ComboboxList className="max-h-[30vh] w-full">
          {(item: IEstadoOption) => (
            <ComboboxItem key={item.value} value={item}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

export const SelectEstadoForm = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label = "Estado",
  helper,
  required,
  readOnly,
  className,
  posLabel,
  disabled,
  ...props
}: Omit<ControllerProps<TFieldValues, TName>, "render"> & {
  label?: string
  className?: string
  required?: boolean
  readOnly?: boolean
  helper?: string | React.ReactNode
  posLabel?: React.ReactNode
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
            <SelectEstado
              value={field.value}
              onValueChange={field.onChange}
              disabled={readOnly || disabled}
              invalid={!!fieldState.error}
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
