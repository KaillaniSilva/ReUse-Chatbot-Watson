import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  city: z.string().trim().optional(),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

export const itemSchema = z.object({
  title: z.string().trim().min(3, "Informe um título"),
  description: z.string().trim().min(10, "Descreva o item com mais detalhes"),
  condition: z.string().trim().min(2, "Informe o estado de conservação"),
  imageUrl: z.string().trim().url("Informe uma URL de imagem válida").optional().or(z.literal("")),
  tipo: z.enum(["DOACAO", "TROCA"]),
  categoryId: z.string().min(1, "Selecione uma categoria"),
});

export const interesseSchema = z.object({
  mensagem: z.string().trim().min(5, "Escreva uma breve mensagem"),
  itemId: z.string().min(1),
});
