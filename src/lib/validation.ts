import { z } from "zod";
import { isValidCep, isValidCpf, isValidPhone, onlyDigits, UF_LIST } from "@/utils/validators";

const str = (max: number) => z.string().trim().max(max);
const optStr = (max: number) => z.string().trim().max(max).optional().nullable();
export const idSchema = z.string().min(1).max(40).regex(/^[A-Za-z0-9_-]+$/);

const touchSchema = z
  .object({ source: optStr(200), medium: optStr(200), campaign: optStr(200), content: optStr(200), term: optStr(200), at: z.number().optional() })
  .partial()
  .nullable()
  .optional();

export const clientContextSchema = z
  .object({
    sessionId: optStr(64),
    visitorId: optStr(64),
    fbp: optStr(200),
    fbc: optStr(500),
    adsConsent: z.boolean().optional(),
    attribution: z
      .object({ first: touchSchema, last: touchSchema, fbclid: optStr(500), gclid: optStr(500), ttclid: optStr(500), landingPage: optStr(500), referrer: optStr(500) })
      .partial()
      .nullable()
      .optional(),
  })
  .partial();

export const cartItemsSchema = z
  .array(z.object({ productId: idSchema, quantity: z.number().int().min(1).max(10), source: z.enum(["cross_sell"]).optional().nullable() }))
  .max(20);

export const quoteSchema = z.object({
  items: cartItemsSchema,
  bumpIds: z.array(idSchema).max(10).default([]),
  couponCode: optStr(40),
});

export const customerSchema = z.object({
  name: str(120)
    .min(5, "Informe seu nome completo")
    .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Informe nome e sobrenome"),
  email: str(160).toLowerCase().email("E-mail inválido"),
  phone: z.string().transform(onlyDigits).refine(isValidPhone, "WhatsApp inválido"),
  cpf: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? onlyDigits(v) : ""))
    .refine((v) => v === "" || isValidCpf(v), "CPF inválido"),
});

export const addressSchema = z.object({
  cep: z.string().transform(onlyDigits).refine(isValidCep, "CEP inválido"),
  street: str(160).min(2, "Informe o endereço"),
  number: str(20).min(1, "Informe o número"),
  complement: optStr(80),
  district: str(80).min(1, "Informe o bairro"),
  city: str(80).min(2, "Informe a cidade"),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => (UF_LIST as readonly string[]).includes(v), "UF inválida"),
});

export const checkoutSchema = z.object({
  checkoutToken: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
  customer: customerSchema,
  address: addressSchema.optional().nullable(),
  items: cartItemsSchema.min(1, "Carrinho vazio"),
  bumpIds: z.array(idSchema).max(10).default([]),
  couponCode: optStr(40),
  marketingConsent: z.boolean().default(false),
  paymentEventId: optStr(80),
  leadKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).optional().nullable(),
  context: clientContextSchema.optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Dados parciais digitados no checkout (antes de gerar o PIX). */
export const checkoutLeadSchema = z.object({
  clientKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/),
  name: optStr(120),
  email: optStr(160),
  phone: optStr(30),
  items: cartItemsSchema.min(1),
  bumpIds: z.array(idSchema).max(10).default([]),
  couponCode: optStr(40),
  context: clientContextSchema.optional(),
});
export type CheckoutLeadInput = z.infer<typeof checkoutLeadSchema>;
