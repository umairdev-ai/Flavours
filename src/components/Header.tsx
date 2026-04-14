import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingCart, Menu, X, UtensilsCrossed } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [isUserLogged, setIsUserLogged] = useState(false);
  const { count } = useCart();
  const { pathname } = useLocation();

  useEffect(() => {
    const updateLogin = () => {
      setIsAdminLogged(Boolean(localStorage.getItem("adminToken")));
      setIsUserLogged(Boolean(localStorage.getItem("userToken")));
    };
    updateLogin();
    window.addEventListener("authChanged", updateLogin);
    return () => window.removeEventListener("authChanged", updateLogin);
  }, []);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/menu", label: "Menu" },
    ...(isUserLogged && !isAdminLogged ? [
      { to: "/reserve", label: "Reserve" },
      { to: "/bookings", label: "My Bookings" }
    ] : []),
    { to: isAdminLogged ? "/admin" : "/auth", label: isAdminLogged ? "Dashboard" : isUserLogged ? "Account" : "Login" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <UtensilsCrossed className="h-7 w-7 text-primary transition-transform group-hover:rotate-12" />
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            MEZB<span className="text-primary">AAN</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map(l => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary relative",
                pathname === l.to && "text-primary after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center animate-in zoom-in">
                {count}
              </span>
            )}
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2 hover:bg-muted rounded-full transition-colors">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background animate-in slide-in-from-top-2">
          <nav className="flex flex-col p-4 gap-2">
            {navLinks.map(l => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-muted",
                  pathname === l.to && "bg-primary/10 text-primary"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
