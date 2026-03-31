import { UtensilsCrossed, MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
                FLAV<span className="text-primary">OURS</span>
              </span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              Where bold flavours meet unforgettable dining. Experience the finest culinary artistry in the city.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Contact</h4>
            <div className="space-y-3 text-sm opacity-70">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> 123 Culinary Ave, Food City</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> (555) 123-4567</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> hello@flavours.com</div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Hours</h4>
            <div className="space-y-3 text-sm opacity-70">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> Mon-Fri: 11am - 10pm</div>
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> Sat-Sun: 10am - 11pm</div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Quick Links</h4>
            <div className="space-y-2 text-sm opacity-70">
              <a href="/menu" className="block hover:text-primary transition-colors">Our Menu</a>
              <a href="/reserve" className="block hover:text-primary transition-colors">Reserve a Table</a>
              <a href="/cart" className="block hover:text-primary transition-colors">Order Online</a>
            </div>
          </div>
        </div>
        <div className="border-t border-background/10 mt-12 pt-8 text-center text-xs opacity-50">
          © 2026 FLAVOURS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
