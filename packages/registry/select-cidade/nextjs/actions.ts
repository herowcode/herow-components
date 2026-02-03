"use server"

const IBGE_API_URL = (state: string) =>
  `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`

export interface ICidade {
  id: number
  nome: string
}

export async function getCidades(state: string): Promise<ICidade[]> {
  const response = await fetch(IBGE_API_URL(state), {
    next: { revalidate: 86400 }, // Cache por 24 horas
  })

  if (!response.ok) {
    throw new Error("Erro ao buscar cidades do IBGE")
  }

  return response.json()
}
