import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const categories = [
    { name: "Roupas e calçados", slug: "roupas", icon: "👕" },
    { name: "Móveis e decoração", slug: "moveis", icon: "🛋️" },
    { name: "Eletrônicos", slug: "eletronicos", icon: "📱" },
    { name: "Livros e brinquedos", slug: "livros", icon: "📚" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  const passwordHash = await bcrypt.hash("reuse123", 10);

  const ana = await prisma.user.upsert({
    where: { email: "ana@reuse.com" },
    update: {},
    create: {
      name: "Ana Souza",
      email: "ana@reuse.com",
      passwordHash,
      city: "Recife - PE",
    },
  });

  const bruno = await prisma.user.upsert({
    where: { email: "bruno@reuse.com" },
    update: {},
    create: {
      name: "Bruno Lima",
      email: "bruno@reuse.com",
      passwordHash,
      city: "Olinda - PE",
    },
  });

  const roupas = await prisma.category.findUniqueOrThrow({ where: { slug: "roupas" } });
  const moveis = await prisma.category.findUniqueOrThrow({ where: { slug: "moveis" } });
  const eletronicos = await prisma.category.findUniqueOrThrow({ where: { slug: "eletronicos" } });
  const livros = await prisma.category.findUniqueOrThrow({ where: { slug: "livros" } });

  const items = [
    {
      title: "Jaqueta jeans tamanho M",
      description: "Usada poucas vezes, sem manchas ou rasgos.",
      condition: "Seminovo",
      tipo: "DOACAO" as const,
      ownerId: ana.id,
      categoryId: roupas.id,
    },
    {
      title: "Mesa de centro de madeira",
      description: "Mesa pequena, ideal para sala de estar.",
      condition: "Bom estado",
      tipo: "TROCA" as const,
      ownerId: bruno.id,
      categoryId: moveis.id,
    },
    {
      title: "Notebook usado (funcionando)",
      description: "Notebook para tarefas básicas, bateria dura cerca de 2h.",
      condition: "Usado",
      tipo: "DOACAO" as const,
      ownerId: ana.id,
      categoryId: eletronicos.id,
    },
    {
      title: "Caixa com livros infantis",
      description: "Cerca de 15 livros infantis em bom estado.",
      condition: "Bom estado",
      tipo: "DOACAO" as const,
      ownerId: bruno.id,
      categoryId: livros.id,
    },
  ];

  for (const item of items) {
    const exists = await prisma.item.findFirst({ where: { title: item.title } });
    if (!exists) {
      await prisma.item.create({ data: item });
    }
  }

  console.log("Seed concluído com sucesso.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
