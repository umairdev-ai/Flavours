import { Plus, Check } from "lucide-react";
import { useState } from "react";
import type { MenuItem } from "@/data/menuData";
import { useCart } from "@/context/CartContext";

export default function MenuCard({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const isUnavailable = item.available === false;

  const handleAdd = () => {
    if (isUnavailable) return;
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        {item.popular && (
          <span className="absolute top-3 left-3 bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Popular
          </span>
        )}
        {isUnavailable && (
          <span className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
            Unavailable
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-card-foreground">{item.name}</h3>
          <span className="text-primary font-bold whitespace-nowrap">Rs. {item.price}</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
        <button
          onClick={handleAdd}
          disabled={isUnavailable}
          className={`w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
            isUnavailable
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : added
                ? "bg-accent text-accent-foreground"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
          }`}
        >
          {isUnavailable ? "Currently Unavailable" : added ? <><Check className="h-4 w-4" /> Added!</> : <><Plus className="h-4 w-4" /> Add to Cart</>}
        </button>
      </div>
    </div>
  );
}

