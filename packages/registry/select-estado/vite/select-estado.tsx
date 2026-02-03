import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

const IBGE_API_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome";

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface SelectEstadoProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectEstado({
  value,
  onValueChange,
  placeholder = "Selecione um estado...",
  disabled = false,
  className,
}: SelectEstadoProps) {
  const [estados, setEstados] = React.useState<Estado[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    async function fetchEstados() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(IBGE_API_URL, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Erro ao buscar estados");
        }

        const data: Estado[] = await response.json();
        setEstados(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError("Erro ao carregar estados");
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEstados();

    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 h-10 px-3 border rounded-md",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center h-10 px-3 border border-destructive rounded-md",
          className
        )}
      >
        <span className="text-destructive">{error}</span>
      </div>
    );
  }

  return (
    <Combobox
      items={estados}
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      className={cn(className)}
    >
      <ComboboxInput placeholder={placeholder} />
      <ComboboxContent>
        <ComboboxEmpty>Nenhum estado encontrado.</ComboboxEmpty>
        <ComboboxList>
          {(item: Estado) => (
            <ComboboxItem key={item.sigla} value={item.sigla}>
              {item.nome} ({item.sigla})
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
