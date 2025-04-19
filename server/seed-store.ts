import { db } from "./db";
import { storeProducts } from "@shared/schema";

async function seedStoreProducts() {
  console.log("Seeding store products...");
  
  // Check if products already exist
  const existingProducts = await db.select().from(storeProducts);
  if (existingProducts.length > 0) {
    console.log(`Found ${existingProducts.length} existing products. Skipping seed.`);
    return;
  }
  
  // Define product categories
  const categories = ["T-Shirts", "Hoodies", "Accessories", "Posters", "Music", "Support a Nurse"];
  
  // Seed products
  const productData = [
    {
      name: "Nursing Rocks Classic T-Shirt",
      description: "Comfortable cotton t-shirt with the Nursing Rocks logo. Available in multiple sizes.",
      price: "24.99",
      image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1080",
      category: "T-Shirts",
      is_featured: true,
      stock_quantity: 100
    },
    {
      name: "Medical Heroes Hoodie",
      description: "Warm and stylish hoodie celebrating our medical heroes. Perfect for casual wear.",
      price: "44.99",
      image_url: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1080",
      category: "Hoodies",
      is_featured: true,
      stock_quantity: 75
    },
    {
      name: "Stethoscope Keychain",
      description: "Metal keychain in the shape of a stethoscope. A perfect gift for any nurse.",
      price: "9.99",
      image_url: "https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&q=80&w=1080",
      category: "Accessories",
      is_featured: false,
      stock_quantity: 150
    },
    {
      name: "Concert Tour Poster",
      description: "Limited edition poster from the latest Nursing Rocks concert tour. High-quality print.",
      price: "19.99",
      image_url: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1080",
      category: "Posters",
      is_featured: true,
      stock_quantity: 50
    },
    {
      name: "Healing Harmonies Album",
      description: "Digital download of the latest album by The Healing Harmonies featuring 12 original tracks.",
      price: "14.99",
      image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1080",
      category: "Music",
      is_featured: false,
      stock_quantity: 200
    },
    {
      name: "Nurses Care Package",
      description: "Sponsor a care package for frontline nurses. Each purchase delivers supplies to a hospital unit.",
      price: "29.99",
      image_url: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=1080",
      category: "Support a Nurse",
      is_featured: true,
      stock_quantity: 100
    },
    {
      name: "Nursing Rocks Baseball Cap",
      description: "Adjustable baseball cap with embroidered Nursing Rocks logo. One size fits most.",
      price: "18.99",
      image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=1080",
      category: "Accessories",
      is_featured: false,
      stock_quantity: 80
    },
    {
      name: "Healthcare Heroes Long Sleeve Tee",
      description: "Long sleeve t-shirt with 'Healthcare Heroes' print on the front. Perfect for cooler weather.",
      price: "29.99",
      image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1080",
      category: "T-Shirts",
      is_featured: false,
      stock_quantity: 90
    },
    {
      name: "Nursing Rocks Concert DVD",
      description: "Live recording of the biggest Nursing Rocks concert of the year featuring all headline acts.",
      price: "24.99",
      image_url: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?auto=format&fit=crop&q=80&w=1080",
      category: "Music",
      is_featured: false,
      stock_quantity: 60
    },
    {
      name: "Scholarship Fund Donation",
      description: "Contribute to the Nursing Rocks Scholarship fund helping nursing students with their education.",
      price: "25.00",
      image_url: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=1080",
      category: "Support a Nurse",
      is_featured: true,
      stock_quantity: 999
    }
  ];
  
  for (const product of productData) {
    await db.insert(storeProducts).values(product);
  }
  
  console.log(`Seeded ${productData.length} store products successfully!`);
}

// The main function will be called from seed.ts

export { seedStoreProducts };