import "dotenv/config";
import { db } from "./db.js";
import { raspadinhas, prizes } from "../shared/schema.js";

type R = typeof raspadinhas.$inferInsert;
type P = typeof prizes.$inferInsert;

const now = new Date();

const raspas: R[] = [
  {
    id: "99c12334-5efc-4dce-80d3-a50c5cd43e6e",
    slug: "gold-rush-basico",
    title: "Gold Rush Básico",
    description: "Ganhe até R$ 2.000 💰🪙",
    price: "2.00" as any,
    imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400",
    category: "gold-rush",
    maxPrize: "2000.00" as any,
    badge: "Popular",
    isActive: 1,
    stock: 1000,
    createdAt: now
  },
  {
    id: "b363b32b-04b9-427a-a4aa-0d61bbf4b665",
    slug: "gold-rush-premium",
    title: "Gold Rush Premium",
    description: "Jackpot 1000x - Ganhe até R$ 100.000 💎🏆",
    price: "10.00" as any,
    imageUrl: "https://images.unsplash.com/photo-1533327325824-76bc4e62d560?w=400",
    category: "gold-rush",
    maxPrize: "100000.00" as any,
    badge: "Jackpot",
    isActive: 1,
    stock: 1000,
    createdAt: now
  },
  {
    id: "7f826289-28ab-4dfc-82b7-7b60c8ee83a3",
    slug: "lucky-animals",
    title: "Lucky Animals",
    description: "Animais da sorte te trazem prêmios 🐼🦊",
    price: "5.00" as any,
    imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400",
    category: "lucky-animals",
    maxPrize: "5000.00" as any,
    badge: "+Chance",
    isActive: 1,
    stock: 1000,
    createdAt: now
  },
  {
    id: "abf12dce-d1db-48ec-92ff-8fb9d361275c",
    slug: "vegas-lights",
    title: "Vegas Lights",
    description: "Cassino de Las Vegas em suas mãos 🎰🎲",
    price: "20.00" as any,
    imageUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400",
    category: "vegas-lights",
    maxPrize: "200000.00" as any,
    badge: "Premium",
    isActive: 1,
    stock: 1000,
    createdAt: now
  },
  {
    id: "2b20fcec-74c2-4846-94d2-8fda5170968a",
    slug: "mythic-gods",
    title: "Mythic Gods",
    description: "Poder dos deuses mitológicos ⚡🔥",
    price: "15.00" as any,
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400",
    category: "mythic-gods",
    maxPrize: "150000.00" as any,
    badge: "Novo",
    isActive: 1,
    stock: 1000,
    createdAt: now
  },
  {
    id: "b8d33151-4c10-4986-bd0f-f1e54b976d5f",
    slug: "crypto-scratch",
    title: "Crypto Scratch",
    description: "To the moon! 🚀🌕 - Jackpot 1000x",
    price: "25.00" as any,
    imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400",
    category: "crypto-scratch",
    maxPrize: "250000.00" as any,
    badge: "Exclusivo",
    isActive: 1,
    stock: 1000,
    createdAt: now
  },
  {
    id: "ffc3936e-e916-484c-8a7c-81c8e4abec6b",
    slug: "candy-mania",
    title: "Candy Mania",
    description: "Doce sorte te espera 🍭🍬",
    price: "1.00" as any,
    imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400",
    category: "candy-mania",
    maxPrize: "1000.00" as any,
    badge: "Iniciante",
    isActive: 1,
    stock: 1000,
    createdAt: now
  }
];

const ps: P[] = [
  { id: "d9a0dca6-3269-4f36-af52-9ddb175976f7", raspadinhaId: "99c12334-5efc-4dce-80d3-a50c5cd43e6e", amount: "2000.00" as any, label: "💎 R$ 2.000", probability: "0.0010" as any, imageUrl: null },
  { id: "79edf037-f91b-49ca-8ac4-b7e389187ce6", raspadinhaId: "99c12334-5efc-4dce-80d3-a50c5cd43e6e", amount: "500.00" as any, label: "🏆 R$ 500", probability: "0.0050" as any, imageUrl: null },
  { id: "f6c4c375-8cec-45f9-bd24-c47ac937192c", raspadinhaId: "99c12334-5efc-4dce-80d3-a50c5cd43e6e", amount: "100.00" as any, label: "🪙 R$ 100", probability: "0.0200" as any, imageUrl: null },
  { id: "34b802fe-e2dd-418f-bd11-b0af1ccc0b39", raspadinhaId: "99c12334-5efc-4dce-80d3-a50c5cd43e6e", amount: "20.00" as any, label: "💰 R$ 20", probability: "0.1000" as any, imageUrl: null },
  { id: "2e4d5411-bb70-4644-8c98-9ba64f4de14c", raspadinhaId: "99c12334-5efc-4dce-80d3-a50c5cd43e6e", amount: "10.00" as any, label: "🔑 R$ 10", probability: "0.2000" as any, imageUrl: null },
  { id: "5d79a5fa-76d0-4fa1-9d74-c60560d8acc6", raspadinhaId: "99c12334-5efc-4dce-80d3-a50c5cd43e6e", amount: "4.00" as any, label: "R$ 4", probability: "0.3000" as any, imageUrl: null },
  { id: "4ab4a00c-51b3-44e5-823b-816c778bac7e", raspadinhaId: "99c12334-5efc-4dce-80d3-a50c5cd43e6e", amount: "0.00" as any, label: "Tente de novo", probability: "0.3740" as any, imageUrl: null },

  { id: "b3fb9a02-4736-4813-9925-1a76242eec48", raspadinhaId: "b363b32b-04b9-427a-a4aa-0d61bbf4b665", amount: "100000.00" as any, label: "💎 Jackpot R$ 100.000", probability: "0.0001" as any, imageUrl: null },
  { id: "2963ab2b-3f6e-4a6c-8814-7524e9f52905", raspadinhaId: "b363b32b-04b9-427a-a4aa-0d61bbf4b665", amount: "10000.00" as any, label: "🏆 R$ 10.000", probability: "0.0010" as any, imageUrl: null },
  { id: "945257a8-bc93-4eb4-b56a-55fd8757ffae", raspadinhaId: "b363b32b-04b9-427a-a4aa-0d61bbf4b665", amount: "1000.00" as any, label: "🪙 R$ 1.000", probability: "0.0100" as any, imageUrl: null },
  { id: "a169103a-dbb6-4d18-ab03-054c77290bf8", raspadinhaId: "b363b32b-04b9-427a-a4aa-0d61bbf4b665", amount: "200.00" as any, label: "💰 R$ 200", probability: "0.0500" as any, imageUrl: null },
  { id: "a154f92e-1a45-42a6-8ce3-28abff97f2ea", raspadinhaId: "b363b32b-04b9-427a-a4aa-0d61bbf4b665", amount: "50.00" as any, label: "🔑 R$ 50", probability: "0.1000" as any, imageUrl: null },
  { id: "aebe7294-96e6-4b1d-bd45-83c8f9a37bcc", raspadinhaId: "b363b32b-04b9-427a-a4aa-0d61bbf4b665", amount: "20.00" as any, label: "R$ 20", probability: "0.2000" as any, imageUrl: null },
  { id: "5e2f9b67-d84b-4ac7-8412-4357af675659", raspadinhaId: "b363b32b-04b9-427a-a4aa-0d61bbf4b665", amount: "0.00" as any, label: "Tente de novo", probability: "0.6389" as any, imageUrl: null }
];

async function main() {
  await db.insert(raspadinhas).values(raspas).onDuplicateKeyUpdate({ set: { title: "updated" } });
  await db.insert(prizes).values(ps).onDuplicateKeyUpdate({ set: { label: "updated" } });
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
