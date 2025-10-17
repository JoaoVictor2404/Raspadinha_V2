import { db } from "./db";
import { raspadinhas, prizes } from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.delete(prizes);
  await db.delete(raspadinhas);

  // Create themed scratch cards
  const scratchCards = [
    // Gold Rush Theme 🪙💎
    {
      title: "Gold Rush Básico",
      slug: "gold-rush-basico",
      price: "2.00",
      maxPrize: "2000.00",
      category: "gold-rush" as const,
      imageUrl: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400",
      description: "Ganhe até R$ 2.000 💰🪙",
      badge: "Popular",
      isActive: true,
    },
    {
      title: "Gold Rush Premium",
      slug: "gold-rush-premium",
      price: "10.00",
      maxPrize: "100000.00",
      category: "gold-rush" as const,
      imageUrl: "https://images.unsplash.com/photo-1533327325824-76bc4e62d560?w=400",
      description: "Jackpot 1000x - Ganhe até R$ 100.000 💎🏆",
      badge: "Jackpot",
      isActive: true,
    },
    
    // Lucky Animals Theme 🐼🦊
    {
      title: "Lucky Animals",
      slug: "lucky-animals",
      price: "5.00",
      maxPrize: "5000.00",
      category: "lucky-animals" as const,
      imageUrl: "https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400",
      description: "Animais da sorte te trazem prêmios 🐼🦊",
      badge: "+Chance",
      isActive: true,
    },
    
    // Vegas Lights Theme 🎰🎲
    {
      title: "Vegas Lights",
      slug: "vegas-lights",
      price: "20.00",
      maxPrize: "200000.00",
      category: "vegas-lights" as const,
      imageUrl: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400",
      description: "Cassino de Las Vegas em suas mãos 🎰🎲",
      badge: "Premium",
      isActive: true,
    },
    
    // Mythic Gods Theme ⚡🔥
    {
      title: "Mythic Gods",
      slug: "mythic-gods",
      price: "15.00",
      maxPrize: "150000.00",
      category: "mythic-gods" as const,
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400",
      description: "Poder dos deuses mitológicos ⚡🔥",
      badge: "Novo",
      isActive: true,
    },
    
    // Crypto Scratch Theme ₿🚀
    {
      title: "Crypto Scratch",
      slug: "crypto-scratch",
      price: "25.00",
      maxPrize: "250000.00",
      category: "crypto-scratch" as const,
      imageUrl: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400",
      description: "To the moon! 🚀🌕 - Jackpot 1000x",
      badge: "Exclusivo",
      isActive: true,
    },
    
    // Candy Mania Theme 🍭🍬
    {
      title: "Candy Mania",
      slug: "candy-mania",
      price: "1.00",
      maxPrize: "1000.00",
      category: "candy-mania" as const,
      imageUrl: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400",
      description: "Doce sorte te espera 🍭🍬",
      badge: "Iniciante",
      isActive: true,
    },
  ];

  const insertedCards = await db.insert(raspadinhas).values(scratchCards).returning();
  console.log(`✅ Created ${insertedCards.length} scratch cards`);

  // Create prizes for each raspadinha
  const prizeData = [];

  for (const card of insertedCards) {
    if (card.slug === "gold-rush-basico") {
      prizeData.push(
        { raspadinhaId: card.id, label: "💎 R$ 2.000", amount: "2000.00", probability: "0.0010" },
        { raspadinhaId: card.id, label: "🏆 R$ 500", amount: "500.00", probability: "0.0050" },
        { raspadinhaId: card.id, label: "🪙 R$ 100", amount: "100.00", probability: "0.0200" },
        { raspadinhaId: card.id, label: "💰 R$ 20", amount: "20.00", probability: "0.1000" },
        { raspadinhaId: card.id, label: "🔑 R$ 10", amount: "10.00", probability: "0.2000" },
        { raspadinhaId: card.id, label: "R$ 4", amount: "4.00", probability: "0.3000" },
        { raspadinhaId: card.id, label: "Tente de novo", amount: "0.00", probability: "0.3740" },
      );
    } else if (card.slug === "gold-rush-premium") {
      prizeData.push(
        { raspadinhaId: card.id, label: "💎 Jackpot R$ 100.000", amount: "100000.00", probability: "0.0001" },
        { raspadinhaId: card.id, label: "🏆 R$ 10.000", amount: "10000.00", probability: "0.0010" },
        { raspadinhaId: card.id, label: "🪙 R$ 1.000", amount: "1000.00", probability: "0.0100" },
        { raspadinhaId: card.id, label: "💰 R$ 200", amount: "200.00", probability: "0.0500" },
        { raspadinhaId: card.id, label: "🔑 R$ 50", amount: "50.00", probability: "0.1000" },
        { raspadinhaId: card.id, label: "R$ 20", amount: "20.00", probability: "0.2000" },
        { raspadinhaId: card.id, label: "Tente de novo", amount: "0.00", probability: "0.6389" },
      );
    } else if (card.slug === "lucky-animals") {
      prizeData.push(
        { raspadinhaId: card.id, label: "🐼 R$ 5.000", amount: "5000.00", probability: "0.0010" },
        { raspadinhaId: card.id, label: "🦊 R$ 1.000", amount: "1000.00", probability: "0.0050" },
        { raspadinhaId: card.id, label: "🐸 R$ 200", amount: "200.00", probability: "0.0200" },
        { raspadinhaId: card.id, label: "🦉 R$ 50", amount: "50.00", probability: "0.1000" },
        { raspadinhaId: card.id, label: "🐠 R$ 25", amount: "25.00", probability: "0.2000" },
        { raspadinhaId: card.id, label: "R$ 10", amount: "10.00", probability: "0.3000" },
        { raspadinhaId: card.id, label: "Tente de novo", amount: "0.00", probability: "0.3740" },
      );
    } else if (card.slug === "vegas-lights") {
      prizeData.push(
        { raspadinhaId: card.id, label: "🎰 Jackpot R$ 200.000", amount: "200000.00", probability: "0.0001" },
        { raspadinhaId: card.id, label: "🎲 R$ 20.000", amount: "20000.00", probability: "0.0010" },
        { raspadinhaId: card.id, label: "🎶 R$ 2.000", amount: "2000.00", probability: "0.0100" },
        { raspadinhaId: card.id, label: "🎤 R$ 500", amount: "500.00", probability: "0.0500" },
        { raspadinhaId: card.id, label: "🍸 R$ 100", amount: "100.00", probability: "0.1000" },
        { raspadinhaId: card.id, label: "R$ 40", amount: "40.00", probability: "0.2000" },
        { raspadinhaId: card.id, label: "Tente de novo", amount: "0.00", probability: "0.6389" },
      );
    } else if (card.slug === "mythic-gods") {
      prizeData.push(
        { raspadinhaId: card.id, label: "⚡ R$ 150.000", amount: "150000.00", probability: "0.0001" },
        { raspadinhaId: card.id, label: "🔥 R$ 15.000", amount: "15000.00", probability: "0.0010" },
        { raspadinhaId: card.id, label: "🪓 R$ 1.500", amount: "1500.00", probability: "0.0100" },
        { raspadinhaId: card.id, label: "🐍 R$ 300", amount: "300.00", probability: "0.0500" },
        { raspadinhaId: card.id, label: "👑 R$ 75", amount: "75.00", probability: "0.1000" },
        { raspadinhaId: card.id, label: "R$ 30", amount: "30.00", probability: "0.2000" },
        { raspadinhaId: card.id, label: "Tente de novo", amount: "0.00", probability: "0.6389" },
      );
    } else if (card.slug === "crypto-scratch") {
      prizeData.push(
        { raspadinhaId: card.id, label: "🚀 To the Moon R$ 250.000", amount: "250000.00", probability: "0.0001" },
        { raspadinhaId: card.id, label: "₿ R$ 25.000", amount: "25000.00", probability: "0.0010" },
        { raspadinhaId: card.id, label: "Ξ R$ 2.500", amount: "2500.00", probability: "0.0100" },
        { raspadinhaId: card.id, label: "💎 R$ 500", amount: "500.00", probability: "0.0500" },
        { raspadinhaId: card.id, label: "🌕 R$ 125", amount: "125.00", probability: "0.1000" },
        { raspadinhaId: card.id, label: "R$ 50", amount: "50.00", probability: "0.2000" },
        { raspadinhaId: card.id, label: "Tente de novo", amount: "0.00", probability: "0.6389" },
      );
    } else if (card.slug === "candy-mania") {
      prizeData.push(
        { raspadinhaId: card.id, label: "🍭 R$ 1.000", amount: "1000.00", probability: "0.0010" },
        { raspadinhaId: card.id, label: "🍩 R$ 200", amount: "200.00", probability: "0.0050" },
        { raspadinhaId: card.id, label: "🍪 R$ 50", amount: "50.00", probability: "0.0200" },
        { raspadinhaId: card.id, label: "🍫 R$ 10", amount: "10.00", probability: "0.1000" },
        { raspadinhaId: card.id, label: "🍬 R$ 5", amount: "5.00", probability: "0.2000" },
        { raspadinhaId: card.id, label: "R$ 2", amount: "2.00", probability: "0.3000" },
        { raspadinhaId: card.id, label: "Tente de novo", amount: "0.00", probability: "0.3740" },
      );
    }
  }

  const insertedPrizes = await db.insert(prizes).values(prizeData).returning();
  console.log(`✅ Created ${insertedPrizes.length} prizes`);

  console.log("✨ Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
