import { Loader2 } from "lucide-react"
import * as React from "react"

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import { InputGroupAddon } from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

const IBGE_API_URL = (state: string) =>
  `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`

// Module-level cache for cidades by state
const cidadesCache = new Map<string, string[]>()
const cidadesFetchPromises = new Map<
  string,
  { promise: Promise<string[]>; controller: AbortController }
>()

async function fetchCidadesWithCache(
  state: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const cached = cidadesCache.get(state)
  if (cached) return cached

  let entry = cidadesFetchPromises.get(state)
  if (!entry) {
    const controller = new AbortController()
    const promise = fetch(IBGE_API_URL(state), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
        return response.json() as Promise<{ nome: string }[]>
      })
      .then((data) => {
        const options = data.map((cidade) => cidade.nome)
        cidadesCache.set(state, options)
        cidadesFetchPromises.delete(state)
        return options
      })
      .catch((error) => {
        cidadesFetchPromises.delete(state)
        throw error
      })
    entry = { promise, controller }
    cidadesFetchPromises.set(state, entry)
  }

  // If caller provided a signal, abort the shared request when caller aborts
  signal?.addEventListener("abort", () => {
    const current = cidadesFetchPromises.get(state)
    if (current) {
      current.controller.abort()
      cidadesFetchPromises.delete(state)
    }
  })

  return entry.promise
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

  // Track previous state to detect actual changes
  const prevStateRef = React.useRef(state)
  // Flag to indicate we need to validate after cities load (only when state changes)
  const [pendingValidation, setPendingValidation] = React.useState(false)

  React.useEffect(() => {
    const stateActuallyChanged = prevStateRef.current !== state
    prevStateRef.current = state

    if (!state) {
      setCidadesOptions([])
      setLoading(false)
      if (stateActuallyChanged) {
        onValueChange?.(null)
      }
      return
    }

    if (stateActuallyChanged) {
      setPendingValidation(true)
    }

    const cached = cidadesCache.get(state)
    if (cached) {
      setCidadesOptions(cached)
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    fetchCidadesWithCache(state, controller.signal)
      .then((options) => {
        if (!controller.signal.aborted) {
          setCidadesOptions(options)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError("Erro ao carregar cidades")
          setLoading(false)
          console.error(err)
        }
      })

    return () => {
      controller.abort()
    }
  }, [state, onValueChange])
  
  // Effect to validate value ONLY when state changed and cities are ready
  React.useEffect(() => {
    // Only validate if we have a pending validation from a state change
    if (!pendingValidation) return
    // Wait for cities to load
    if (loading || cidadesOptions.length === 0) return

    // Clear the pending validation flag
    setPendingValidation(false)

    // Clear value if it doesn't exist in the cities array
    if (value && !cidadesOptions.includes(value)) {
      onValueChange?.(null)
    }
  }, [pendingValidation, cidadesOptions, loading, value, onValueChange])

  // Include current value in items while loading to prevent Combobox from clearing it
  const effectiveOptions = React.useMemo(() => {
    // If we have a value and it's not in cidadesOptions, temporarily include it
    // This prevents the Combobox from clearing the value before cities load
    if (value && cidadesOptions.length === 0) {
      return [value]
    }
    return cidadesOptions
  }, [value, cidadesOptions])

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
      items={effectiveOptions}
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