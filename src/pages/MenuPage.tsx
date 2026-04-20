import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { menuItems as initialMenuItems, categories, type MenuItem } from "@/data/menuData";
import MenuCard from "@/components/MenuCard";

export default function MenuPage() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const menuItems = useMemo<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem("menuItems");
      return saved ? JSON.parse(saved) : initialMenuItems;
    } catch {
      return initialMenuItems;
    }
  }, []);

  const filtered = useMemo(() => {
    return menuItems.filter(item => {
      const matchCat = category === "All" || item.category === category;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [category, search]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Our Menu</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Explore our carefully curated selection of dishes made with the freshest ingredients
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 w-full sm:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  category === cat
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(item => (
              <MenuCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No dishes found</p>
            <p className="text-sm mt-1">Try adjusting your search or category</p>
          </div>
        )}
      </div>
    </div>
  );
}
