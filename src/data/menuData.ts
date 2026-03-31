export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  popular?: boolean;
}

export interface TableSlot {
  id: string;
  number: number;
  capacity: number;
  available: boolean;
}

export const categories = ["All", "Starters", "Main Course", "Desserts", "Drinks"];

export const menuItems: MenuItem[] = [
  { id: "1", name: "Bruschetta", description: "Grilled bread topped with fresh tomatoes, basil, and garlic drizzle", price: 249, category: "Starters", image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop", popular: true },
  { id: "2", name: "Calamari Fritti", description: "Crispy fried squid rings served with lemon aioli", price: 349, category: "Starters", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop" },
  { id: "3", name: "Soup of the Day", description: "Chef's daily handcrafted soup with artisan bread", price: 199, category: "Starters", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop" },
  { id: "4", name: "Spring Rolls", description: "Crunchy vegetable spring rolls with sweet chili sauce", price: 279, category: "Starters", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop", popular: true },
  { id: "5", name: "Grilled Ribeye Steak", description: "12oz premium ribeye with roasted vegetables and red wine jus", price: 899, category: "Main Course", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop", popular: true },
  { id: "6", name: "Pan-Seared Salmon", description: "Atlantic salmon fillet with asparagus and lemon butter sauce", price: 749, category: "Main Course", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop", popular: true },
  { id: "7", name: "Mushroom Risotto", description: "Creamy arborio rice with wild mushrooms and parmesan", price: 549, category: "Main Course", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop" },
  { id: "8", name: "Chicken Parmesan", description: "Breaded chicken breast with marinara sauce and mozzarella", price: 599, category: "Main Course", image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop" },
  { id: "9", name: "Lobster Pasta", description: "Fresh lobster tail with linguine in a creamy tomato bisque", price: 999, category: "Main Course", image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop" },
  { id: "10", name: "Tiramisu", description: "Classic Italian coffee-flavored layered dessert", price: 349, category: "Desserts", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop", popular: true },
  { id: "11", name: "Crème Brûlée", description: "Vanilla custard with a caramelized sugar crust", price: 299, category: "Desserts", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&h=300&fit=crop" },
  { id: "12", name: "Chocolate Lava Cake", description: "Warm chocolate cake with a molten center and vanilla ice cream", price: 399, category: "Desserts", image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop" },
  { id: "13", name: "Craft Lemonade", description: "Freshly squeezed lemonade with mint and ginger", price: 149, category: "Drinks", image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop" },
  { id: "14", name: "Espresso Martini", description: "Vodka, coffee liqueur, and fresh espresso", price: 449, category: "Drinks", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop" },
  { id: "15", name: "Berry Smoothie", description: "Mixed berries blended with yogurt and honey", price: 199, category: "Drinks", image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop" },
];

export const tables: TableSlot[] = [
  { id: "t1", number: 1, capacity: 2, available: true },
  { id: "t2", number: 2, capacity: 2, available: true },
  { id: "t3", number: 3, capacity: 4, available: true },
  { id: "t4", number: 4, capacity: 4, available: false },
  { id: "t5", number: 5, capacity: 6, available: true },
  { id: "t6", number: 6, capacity: 6, available: true },
  { id: "t7", number: 7, capacity: 8, available: true },
  { id: "t8", number: 8, capacity: 8, available: false },
  { id: "t9", number: 9, capacity: 10, available: true },
  { id: "t10", number: 10, capacity: 4, available: true },
];

export const testimonials = [
  { id: 1, name: "Sarah Mitchell", text: "Absolutely incredible dining experience! The ribeye steak was cooked to perfection.", rating: 5, avatar: "SM" },
  { id: 2, name: "James Rodriguez", text: "Best Italian food in the city. The tiramisu is a must-try!", rating: 5, avatar: "JR" },
  { id: 3, name: "Emily Chen", text: "Beautiful atmosphere and amazing service. We'll definitely be back!", rating: 4, avatar: "EC" },
  { id: 4, name: "Michael Brown", text: "The online ordering was seamless and the food arrived hot and fresh.", rating: 5, avatar: "MB" },
];
