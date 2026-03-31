import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, CheckCircle, User, Mail, Phone } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { buildApiUrl } from "@/lib/api";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, total } = useCart();
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderType, setOrderType] = useState<"delivery" | "pickup">("delivery");
  const [userDetails, setUserDetails] = useState({ name: "", email: "", phone: "" });
  const [showUserForm, setShowUserForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finalTotal = total + (orderType === "delivery" && total < 500 ? 49 : 0) + Math.round(total * 0.05);

  const handlePlaceOrder = async () => {
    if (!userDetails.name || !userDetails.email || !userDetails.phone) {
      setShowUserForm(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderData = {
        userName: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
        items: items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: finalTotal
      };

      const res = await fetch(buildApiUrl("/orders"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
      });

      if (res.ok) {
        clearCart();
        setOrderPlaced(true);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to place order");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  if (orderPlaced) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4 animate-in fade-in zoom-in">
          <CheckCircle className="h-20 w-20 text-accent mx-auto" />
          <h2 className="text-3xl font-bold">Order Confirmed!</h2>
          <p className="text-muted-foreground">Your order has been placed successfully. Thank you!</p>
          <p className="text-sm text-muted-foreground">
            {orderType === "delivery" ? "Estimated delivery: 30-45 minutes" : "Pickup ready in 20 minutes"}
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-all mt-4"
          >
            Order More <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingBag className="h-20 w-20 text-muted-foreground/30 mx-auto" />
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="text-muted-foreground">Looks like you haven't added anything yet</p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-all"
          >
            Browse Menu <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Your Cart</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex gap-4 bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
                <img src={item.image} alt={item.name} className="w-24 h-24 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 bg-muted rounded-full">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1.5 hover:text-primary transition-colors">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1.5 hover:text-primary transition-colors">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-bold text-primary">₹{item.price * item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-card border rounded-2xl p-6 h-fit sticky top-24 space-y-6">
            <h3 className="text-lg font-bold">Order Summary</h3>

            {/* Order type */}
            <div className="flex gap-2">
              {(["delivery", "pickup"] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    orderType === type
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {type === "delivery" ? "🚗 Delivery" : "🏪 Pickup"}
                </button>
              ))}
            </div>

            {/* User Details Form */}
            {showUserForm && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="font-semibold flex items-center gap-2"><User className="h-4 w-4" /> Contact Details</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    required
                    value={userDetails.name}
                    onChange={e => setUserDetails(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={userDetails.email}
                    onChange={e => setUserDetails(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    required
                    value={userDetails.phone}
                    onChange={e => setUserDetails(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{orderType === "delivery" ? "Delivery Fee" : "Pickup"}</span><span>{orderType === "delivery" && total < 500 ? "₹49" : "FREE"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">GST (5%)</span><span>₹{Math.round(total * 0.05)}</span></div>
              <div className="border-t pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-primary">
                  ₹{finalTotal}
                </span>
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
