"use server"

const IBGE_API_URL =
  "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"

export interface IEstado {
  id: number
  sigla: string
  nome: string
}

export async function getEstados(): Promise<IEstado[]> {
  const response = await fetch(IBGE_API_URL, {
    next: { revalidate: 86400 }, // Cache por 24 horas
  })

  if (!response.ok) {
    throw new Error("Erro ao buscar estados do IBGE")
  }

  return response.json()
}
