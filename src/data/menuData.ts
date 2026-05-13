export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  popular?: boolean;
  available?: boolean;
}

export interface TableSlot {
  id: string;
  number: number;
  capacity: number;
  available: boolean;
}

export const categories = ["All", "Starters", "Main Course", "Desserts", "Drinks"];

export const menuItems: MenuItem[] = [
  { id: "1", name: "Bruschetta", description: "Grilled sourdough bread topped with fresh heirloom tomatoes, fragrant basil, minced garlic, and premium olive oil drizzle. Perfectly charred on the outside while remaining soft inside. A classic Italian starter that's light, fresh, and bursting with Mediterranean flavors. Best enjoyed while warm and served as an appetizer to begin your culinary journey.", price: 249, category: "Starters", image: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop", popular: true, available: true },
  { id: "2", name: "Calamari Fritti", description: "Tender squid rings hand-breaded and deep-fried until golden and crispy on the outside while remaining tender inside. Served with house-made lemon aioli for dipping and a squeeze of fresh lemon juice. Features a perfectly balanced seasoning blend and maintains its delicate texture. A must-try seafood appetizer that's crispy, flavorful, and absolutely addictive for seafood lovers.", price: 349, category: "Starters", image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop", available: true },
  { id: "3", name: "Soup of the Day", description: "Chef's daily handcrafted creation using seasonal, locally-sourced ingredients and traditional techniques. Each day brings a new flavor profile—from creamy bisques to hearty broths. Accompanied by warm artisan bread baked fresh in-house. Perfect comfort food that warms the soul. Portions are generous and satisfying, making it an ideal start to any meal.", price: 199, category: "Starters", image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop", available: true },
  { id: "4", name: "Spring Rolls", description: "Delicate rice paper wraps filled with crispy vegetables including cabbage, carrots, and fresh herbs. Fried until golden and served with tangy sweet chili sauce and creamy peanut dipping sauce. Light yet satisfying appetizer that's perfect for sharing. Features authentic Asian flavors and preparation techniques. A vegetarian-friendly option that doesn't compromise on taste or texture.", price: 279, category: "Starters", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop", popular: true, available: true },
  { id: "5", name: "Grilled Ribeye Steak", description: "Premium 12oz ribeye steak grilled to your preferred temperature with a perfect charred crust and juicy interior. Accompanied by roasted seasonal vegetables and rich red wine jus made from a secret blend of herbs and spices. Cooked using traditional French techniques to bring out maximum flavor. A carnivore's delight featuring top-grade beef that melts in your mouth. Served with your choice of sides including mashed potatoes or grilled asparagus.", price: 899, category: "Main Course", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop", popular: true, available: true },
  { id: "6", name: "Pan-Seared Salmon", description: "Fresh Atlantic salmon fillet with crispy skin on the outside and tender, flaky flesh inside. Pan-seared to perfection and finished with a silky lemon butter sauce infused with fresh herbs and capers. Served alongside tender asparagus spears and citrus-steamed vegetables. Rich in omega-3 fatty acids and perfectly balanced flavors. A healthy yet indulgent choice for the discerning diner.", price: 749, category: "Main Course", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop", popular: true, available: true },
  { id: "7", name: "Mushroom Risotto", description: "Creamy and luxurious arborio rice cooked slowly with vegetable broth, white wine, and infused with umami-rich wild mushrooms including porcini and shiitake. Finished with parmesan cheese and truffle oil for an earthy, sophisticated flavor profile. Each grain of rice is perfectly al dente and coated in creamy sauce. Vegetarian-friendly comfort food that's both elegant and satisfying. A masterpiece of Italian culinary tradition.", price: 549, category: "Main Course", image: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&h=300&fit=crop", available: true },
  { id: "8", name: "Chicken Parmesan", description: "Tender chicken breast hand-breaded with Italian breadcrumbs and fried until golden, then topped with melted mozzarella and fresh parmesan cheese. Drenched in homemade marinara sauce made from San Marzano tomatoes and fresh basil. Served over a bed of pasta or with garlic bread for dipping. Classic Italian-American comfort food that's crispy on the outside and juicy inside. A family favorite that never disappoints.", price: 599, category: "Main Course", image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop", available: true },
  { id: "9", name: "Lobster Pasta", description: "Succulent fresh lobster tail chunks tossed with delicate linguine pasta in a decadent creamy tomato bisque sauce. Infused with white wine, shallots, and a hint of saffron for sophisticated flavor. Garnished with fresh parsley and edible flowers for elegant presentation. Premium seafood combined with Italian pasta mastery for a truly luxurious dining experience. A show-stopping main course that impresses with both taste and presentation.", price: 999, category: "Main Course", image: "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop", available: true },
  { id: "10", name: "Tiramisu", description: "The iconic Italian dessert layered with mascarpone cream, espresso-soaked ladyfingers, and a dusting of cocoa powder. Made with authentic imported ingredients and served chilled to enhance its delicate flavors. Each spoonful combines the richness of mascarpone, bitterness of espresso, and sweetness of sugar in perfect harmony. A timeless favorite that has graced Italian tables for generations. Best paired with an after-dinner coffee for the ultimate indulgence.", price: 349, category: "Desserts", image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop", popular: true, available: true },
  { id: "11", name: "Creme Brulee", description: "Silky smooth vanilla bean custard base made with fresh cream and egg yolks, topped with a caramelized sugar crust that shatters under your spoon. The contrast between the crispy caramelized top and creamy custard underneath creates a luxurious texture experience. Made with premium Madagascar vanilla for authentic flavor. A French classic that demonstrates the art of elegant dessert-making. Served warm for maximum enjoyment.", price: 299, category: "Desserts", image: "https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=400&h=300&fit=crop", available: true },
  { id: "12", name: "Chocolate Lava Cake", description: "Decadent warm chocolate cake with a gooey molten center that flows out when you cut into it. Made with premium Belgian chocolate and served alongside a scoop of creamy vanilla ice cream that melts into the warm chocolate. The contrast of temperatures and textures creates a heavenly experience. Topped with edible gold leaf and fresh berries for elegant presentation. An indulgent treat for chocolate lovers.", price: 399, category: "Desserts", image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop", available: true },
  { id: "13", name: "Craft Lemonade", description: "Refreshing house-made lemonade using freshly squeezed lemons, fresh mint leaves, and aromatic ginger slices for a zesty kick. Perfectly balanced sweetness with a hint of tartness and natural carbonation. Free from artificial preservatives and colors, made daily in small batches. Garnished with lemon wheels and fresh mint sprigs for visual appeal. An ideal thirst quencher on warm days or perfect alongside any meal.", price: 149, category: "Drinks", image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop", available: true },
  { id: "14", name: "Espresso Martini", description: "Premium vodka combined with coffee liqueur and a shot of freshly pulled espresso for a sophisticated cocktail experience. Shaken vigorously over ice and served in a chilled martini glass with a creamy coffee foam top. The perfect balance of caffeine kick and smooth spirits. Garnished with coffee beans for authentic café flair. An elegant after-dinner cocktail that's both energizing and indulgent.", price: 449, category: "Drinks", image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop", available: true },
  { id: "15", name: "Berry Smoothie", description: "Smooth and creamy blend of fresh mixed berries including strawberries, blueberries, and raspberries, combined with Greek yogurt and a drizzle of raw honey. Rich in antioxidants and natural probiotics from the yogurt. Topped with granola and fresh berries for crunch and visual appeal. A healthy, nutritious option that tastes like indulgence. Perfect for breakfast or as a refreshing light dessert alternative.", price: 199, category: "Drinks", image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400&h=300&fit=crop", available: true },
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
