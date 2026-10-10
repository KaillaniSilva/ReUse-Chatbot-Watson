/**
 * mockData.ts
 * Dados fictícios para popular o app ReUse em ambiente de desenvolvimento.
 * Em produção estes dados viriam de uma API REST.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type ItemCondition = "Novo" | "Excelente" | "Bom" | "Razoável";
export type ItemType = "doação" | "venda" | "troca";

export type MarketItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: ItemCondition;
  price: number;
  type: ItemType;
  emoji: string;
  bgColor: string;
  userName: string;
  userAvatar: string;
  location: string;
  createdAt: string;
  views: number;
  isFeatured?: boolean;
};

export type ChatConversation = {
  id: string;
  participantName: string;
  participantAvatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  itemTitle: string;
};

// ─── Categorias ───────────────────────────────────────────────────────────────
export const CATEGORIES = [
  { id: "all", label: "Todos", emoji: "🌿" },
  { id: "roupas", label: "Roupas", emoji: "👕" },
  { id: "moveis", label: "Móveis", emoji: "🛋️" },
  { id: "eletronicos", label: "Eletrônicos", emoji: "📱" },
  { id: "livros", label: "Livros", emoji: "📚" },
  { id: "brinquedos", label: "Brinquedos", emoji: "🧸" },
  { id: "casa", label: "Casa", emoji: "🏠" },
  { id: "esportes", label: "Esportes", emoji: "⚽" },
  { id: "outros", label: "Outros", emoji: "📦" },
];

// ─── Itens mock ───────────────────────────────────────────────────────────────
export const MOCK_ITEMS: MarketItem[] = [
  {
    id: "1",
    title: "Sofá 3 Lugares",
    description:
      "Sofá em excelente estado, tecido cinza escuro. Pouco uso, sem manchas ou rasgos. Retirada em Pinheiros.",
    category: "moveis",
    condition: "Excelente",
    price: 0,
    type: "doação",
    emoji: "🛋️",
    bgColor: "#E8F5F0",
    userName: "Ana Lima",
    userAvatar: "🌿",
    location: "Pinheiros, SP",
    createdAt: "2h atrás",
    views: 48,
    isFeatured: true,
  },
  {
    id: "2",
    title: "Camiseta Nike Tamanho M",
    description:
      "Camiseta original Nike, tamanho M, cor azul navy. Usada poucas vezes, lavada e passada.",
    category: "roupas",
    condition: "Bom",
    price: 35,
    type: "venda",
    emoji: "👕",
    bgColor: "#EFF6FF",
    userName: "João Silva",
    userAvatar: "🌱",
    location: "Bela Vista, SP",
    createdAt: "5h atrás",
    views: 22,
  },
  {
    id: "3",
    title: "iPhone 12 - 64GB",
    description:
      "iPhone 12 na cor preta, 64GB. Bateria 89%, funciona perfeitamente. Tela sem arranhões. Acompanha carregador original.",
    category: "eletronicos",
    condition: "Bom",
    price: 1200,
    type: "venda",
    emoji: "📱",
    bgColor: "#F0F4FF",
    userName: "Carlos Melo",
    userAvatar: "🪴",
    location: "Moema, SP",
    createdAt: "1d atrás",
    views: 134,
    isFeatured: true,
  },
  {
    id: "4",
    title: "Kit Livros Harry Potter",
    description:
      "Coleção completa Harry Potter 7 volumes, editora Rocco. Todos em bom estado, sem marcas de caneta.",
    category: "livros",
    condition: "Bom",
    price: 0,
    type: "doação",
    emoji: "📚",
    bgColor: "#FFF7ED",
    userName: "Maria Souza",
    userAvatar: "🌳",
    location: "Vila Madalena, SP",
    createdAt: "2d atrás",
    views: 89,
  },
  {
    id: "5",
    title: "Mesa de Jantar 6 Cadeiras",
    description:
      "Mesa de jantar em madeira maciça com 6 cadeiras estofadas. Comprimento 1,80m. Pequenos riscos na superfície.",
    category: "moveis",
    condition: "Razoável",
    price: 650,
    type: "venda",
    emoji: "🪑",
    bgColor: "#FEF9EE",
    userName: "Roberto Alves",
    userAvatar: "🌱",
    location: "Santana, SP",
    createdAt: "3d atrás",
    views: 56,
  },
  {
    id: "6",
    title: "Bicicleta Infantil Aro 16",
    description:
      "Bicicleta infantil com rodinhas, cor rosa. Para crianças de 4 a 7 anos. Em ótimo estado.",
    category: "brinquedos",
    condition: "Excelente",
    price: 0,
    type: "doação",
    emoji: "🚲",
    bgColor: "#FDF2F8",
    userName: "Patricia Neves",
    userAvatar: "🌿",
    location: "Itaim Bibi, SP",
    createdAt: "4d atrás",
    views: 71,
  },
  {
    id: "7",
    title: "Notebook Dell Inspiron 15",
    description:
      "Dell Inspiron 15, Intel Core i5 10ª geração, 8GB RAM, SSD 256GB. Windows 11 original. Carregador incluso.",
    category: "eletronicos",
    condition: "Bom",
    price: 1800,
    type: "troca",
    emoji: "💻",
    bgColor: "#F0F9FF",
    userName: "Felipe Costa",
    userAvatar: "🌲",
    location: "Brooklin, SP",
    createdAt: "5d atrás",
    views: 203,
    isFeatured: true,
  },
  {
    id: "8",
    title: "Jaqueta Jeans Feminina P",
    description:
      "Jaqueta jeans tamanho P. Modelo clássico, cor azul médio. Excelente estado, usada apenas 2 vezes.",
    category: "roupas",
    condition: "Excelente",
    price: 60,
    type: "venda",
    emoji: "👗",
    bgColor: "#EFF6FF",
    userName: "Luciana Torres",
    userAvatar: "🌱",
    location: "Perdizes, SP",
    createdAt: "6d atrás",
    views: 34,
  },
  {
    id: "9",
    title: "Panela Elétrica de Arroz",
    description:
      "Panela elétrica de arroz, capacidade 10 xícaras. Marca Mondial. Funciona perfeitamente, acompanha copo medidor e colher.",
    category: "casa",
    condition: "Bom",
    price: 0,
    type: "doação",
    emoji: "🍳",
    bgColor: "#ECFDF5",
    userName: "Sandra Pires",
    userAvatar: "🌿",
    location: "Tatuapé, SP",
    createdAt: "1s atrás",
    views: 17,
  },
  {
    id: "10",
    title: "Tênis Adidas Running 41",
    description:
      "Tênis Adidas masculino número 41, modelo EQ21 Run. Cor branco/cinza. Pouco uso, solado em ótimo estado.",
    category: "esportes",
    condition: "Excelente",
    price: 120,
    type: "venda",
    emoji: "👟",
    bgColor: "#F8F9FA",
    userName: "Bruno Ferreira",
    userAvatar: "🪴",
    location: "Santo André, SP",
    createdAt: "2s atrás",
    views: 44,
  },
  {
    id: "11",
    title: "Smart TV 43\" Samsung",
    description:
      'Smart TV Samsung 43 polegadas, Full HD. Acesso Netflix, YouTube. Controle remoto original. Pequeno risco no canto.',
    category: "eletronicos",
    condition: "Bom",
    price: 900,
    type: "venda",
    emoji: "📺",
    bgColor: "#F0F4FF",
    userName: "Marcelo Santos",
    userAvatar: "🌳",
    location: "Guarulhos, SP",
    createdAt: "3s atrás",
    views: 98,
  },
  {
    id: "12",
    title: "Livros de Engenharia Civil",
    description:
      "Lote com 8 livros de Engenharia Civil: resistência dos materiais, estruturas, concreto armado. ABNT atualizada.",
    category: "livros",
    condition: "Bom",
    price: 0,
    type: "doação",
    emoji: "📖",
    bgColor: "#FFF7ED",
    userName: "Diego Moura",
    userAvatar: "🌱",
    location: "Campinas, SP",
    createdAt: "4s atrás",
    views: 63,
  },
];

// ─── Conversas mock ────────────────────────────────────────────────────────────
export const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: "c1",
    participantName: "Ana Lima",
    participantAvatar: "🌿",
    lastMessage: "Ainda está disponível o sofá?",
    lastMessageTime: "10:32",
    unreadCount: 2,
    itemTitle: "Sofá 3 Lugares",
  },
  {
    id: "c2",
    participantName: "Carlos Melo",
    participantAvatar: "🪴",
    lastMessage: "Posso buscar na quarta-feira!",
    lastMessageTime: "Ontem",
    unreadCount: 0,
    itemTitle: "iPhone 12 - 64GB",
  },
  {
    id: "c3",
    participantName: "Maria Souza",
    participantAvatar: "🌳",
    lastMessage: "Combinado, te mando o endereço.",
    lastMessageTime: "Seg",
    unreadCount: 0,
    itemTitle: "Kit Livros Harry Potter",
  },
  {
    id: "c4",
    participantName: "Felipe Costa",
    participantAvatar: "🌲",
    lastMessage: "Aceito troca por Samsung Galaxy S21?",
    lastMessageTime: "Dom",
    unreadCount: 1,
    itemTitle: "Notebook Dell Inspiron 15",
  },
];

// ─── Mensagens mock de uma conversa ───────────────────────────────────────────
export type ChatMessage = {
  id: string;
  text: string;
  senderId: "me" | "other";
  timestamp: string;
};

export const MOCK_MESSAGES: ChatMessage[] = [
  { id: "m1", text: "Olá! Ainda está disponível?", senderId: "other", timestamp: "10:20" },
  { id: "m2", text: "Oi! Sim, está sim!", senderId: "me", timestamp: "10:22" },
  { id: "m3", text: "Qual a condição exata do item?", senderId: "other", timestamp: "10:23" },
  {
    id: "m4",
    text: "Está em ótimo estado, só tem um pequeno risco que mal dá pra ver.",
    senderId: "me",
    timestamp: "10:25",
  },
  { id: "m5", text: "Tem como mandar mais fotos?", senderId: "other", timestamp: "10:27" },
  {
    id: "m6",
    text: "Claro, vou tirar umas fotos agora e te mando!",
    senderId: "me",
    timestamp: "10:28",
  },
  { id: "m7", text: "Ainda está disponível o sofá?", senderId: "other", timestamp: "10:32" },
];
