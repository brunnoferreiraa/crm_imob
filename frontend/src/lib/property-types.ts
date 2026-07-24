export const propertyTypes = [
  ["apartamento", "Apartamento"],
  ["casa", "Casa"],
  ["sobrado", "Sobrado"],
  ["studio", "Kitnet / Studio"],
  ["cobertura", "Cobertura"],
  ["terreno", "Terreno"],
  ["chacara", "Chácara"],
  ["sitio", "Sítio"],
  ["fazenda", "Fazenda"],
  ["sala_comercial", "Sala comercial"],
  ["loja", "Loja"],
  ["galpao", "Galpão"],
  ["predio_comercial", "Prédio comercial"],
  ["escritorio", "Escritório"],
] as const;
export type PropertyType = (typeof propertyTypes)[number][0];
export const propertyTypeLabel = (value: string) =>
  propertyTypes.find(([key]) => key === value)?.[1] ?? value;
