import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Star, Flame, Clock, Truck } from "lucide-react";
import { menuItems, testimonials } from "@/data/menuData";
import MenuCard from "@/components/MenuCard";

const features = [
  { icon: Flame, title: "Wood-Fired", desc: "Authentic flavors from our custom brick oven" },
  { icon: Clock, title: "Fast Service", desc: "Ready in 30 minutes or it's on us" },
  { icon: Truck, title: "Free Delivery", desc: "Complimentary delivery on orders over ₹500" },
];

export default function Index() {
  const [userLogged, setUserLogged] = useState(false);
  const [adminLogged, setAdminLogged] = useState(false);
  const popular = menuItems.filter(i => i.popular).slice(0, 4);

  useEffect(() => {
    setUserLogged(Boolean(localStorage.getItem("userToken")));
    setAdminLogged(Boolean(localStorage.getItem("adminToken")));
    const update = () => {
      setUserLogged(Boolean(localStorage.getItem("userToken")));
      setAdminLogged(Boolean(localStorage.getItem("adminToken")));
    };
    window.addEventListener("authChanged", update);
    return () => window.removeEventListener("authChanged", update);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80"
            alt="Restaurant interior dining room"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4 py-32 md:py-44">
          <div className="max-w-xl space-y-6">
            <span className="inline-block bg-primary/20 text-primary border border-primary/30 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full backdrop-blur-sm">
              🔥 Now Open for Reservations
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight">
              Welcome to <span className="text-primary">Mezbaan</span>,<br />
              your private dining destination
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-md leading-relaxed">
              Book a table, enjoy curated dishes, and step into a warm restaurant experience crafted for family and friends.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3.5 rounded-full font-semibold hover:bg-primary/90 transition-all hover:gap-3 active:scale-[0.98]"
              >
                Order Now <ArrowRight className="h-4 w-4" />
              </Link>
              {userLogged && !adminLogged ? (
                <Link
                  to="/reserve"
                  className="inline-flex items-center gap-2 bg-white/10 text-white backdrop-blur-sm border border-white/20 px-8 py-3.5 rounded-full font-semibold hover:bg-white/20 transition-all"
                >
                  Book a Table
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 bg-white/10 text-white backdrop-blur-sm border border-white/20 px-8 py-3.5 rounded-full font-semibold hover:bg-white/20 transition-all"
                >
                  Login to Reserve
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 -mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <div key={i} className="bg-card border rounded-2xl p-6 flex items-center gap-4 shadow-lg hover:shadow-xl transition-shadow">
              <div className="bg-primary/10 p-3 rounded-xl">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Items */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-3 mb-12">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">Chef's Picks</span>
          <h2 className="text-3xl md:text-4xl font-bold">Most Popular Dishes</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Our guests' all-time favorites, crafted with passion and the finest ingredients</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popular.map(item => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
          >
            View Full Menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-3 mb-12">
            <span className="text-primary text-sm font-semibold uppercase tracking-widest">Reviews</span>
            <h2 className="text-3xl md:text-4xl font-bold">What Our Guests Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map(t => (
              <div key={t.id} className="bg-card border rounded-2xl p-6 space-y-4 hover:shadow-lg transition-shadow">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {t.avatar}
                  </div>
                  <span className="text-sm font-medium">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative rounded-3xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1541544741938-0af808871cc9?auto=format&fit=crop&w=1200&q=80"
            alt="Restaurant exterior and dining area"
            className="w-full h-64 md:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40 flex items-center">
            <div className="px-8 md:px-16 space-y-4 max-w-lg">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Ready for an Experience?</h2>
              <p className="text-white/70">Reserve your table now and enjoy an unforgettable evening of fine dining.</p>
              <Link
                to="/reserve"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-all"
              >
                Reserve Now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
