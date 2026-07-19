import { z } from "zod";
import { propertyTypes } from "@/lib/property-types";

const optionalNumber = z.string().optional().transform((value) => value ? Number(value) : null);

export const clientSchema = z.object({
  name: z.string().min(2, "Informe o nome"),
  email: z.union([z.email("E-mail inválido"), z.literal("")]),
  phone: z.string().min(8, "Telefone inválido"),
  whatsapp: z.string().optional(),
  cpf: z.string().optional(),
  client_type: z.enum(["comprador", "locatario", "proprietario", "investidor"]),
  lead_source: z.string().optional(),
  status: z.enum(["novo", "em_atendimento", "qualificado", "inativo"]),
  notes: z.string().optional(),
  property_type: z.enum(propertyTypes.map(([value]) => value) as [string, ...string[]]).optional().or(z.literal("")),
  budget_min: optionalNumber,
  budget_max: optionalNumber,
  bedrooms: optionalNumber,
  cities: z.string().optional(),
  neighborhoods: z.string().optional(),
});

export type ClientFormInput = z.input<typeof clientSchema>;
export type ClientFormOutput = z.output<typeof clientSchema>;
