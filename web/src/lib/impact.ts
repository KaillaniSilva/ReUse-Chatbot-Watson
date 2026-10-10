// Estimativas ilustrativas de impacto evitado ao reutilizar um item (por unidade).
const FACTORS: Record<string, { co2Kg: number; waterL: number; wasteKg: number }> = {
  roupas: { co2Kg: 6, waterL: 2700, wasteKg: 0.5 },
  moveis: { co2Kg: 40, waterL: 300, wasteKg: 15 },
  eletronicos: { co2Kg: 70, waterL: 1500, wasteKg: 2 },
  livros: { co2Kg: 2.5, waterL: 100, wasteKg: 0.6 },
};

const DEFAULT_FACTOR = { co2Kg: 5, waterL: 200, wasteKg: 1 };

export type Impact = { co2Kg: number; waterL: number; wasteKg: number };

export function impactForCategory(slug: string): Impact {
  return FACTORS[slug] ?? DEFAULT_FACTOR;
}

export function sumImpact(slugs: string[]): Impact {
  return slugs.reduce<Impact>(
    (acc, slug) => {
      const f = impactForCategory(slug);
      return {
        co2Kg: acc.co2Kg + f.co2Kg,
        waterL: acc.waterL + f.waterL,
        wasteKg: acc.wasteKg + f.wasteKg,
      };
    },
    { co2Kg: 0, waterL: 0, wasteKg: 0 }
  );
}

export function formatNumber(value: number) {
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
