import { useEffect, useState } from "react";
import { CalendarDays, Users, Clock, CheckCircle, ArrowRight, Plus, Minus } from "lucide-react";
import { tables, menuItems } from "@/data/menuData";
import { Link } from "react-router-dom";
import { buildApiUrl } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function ReservePage() {
  const { items: cartItems, addItem, updateQuantity, clearCart } = useCart();
  const [form, setForm] = useState({ date: "", time: "", guests: "2", mobile: "" });
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUserLogged, setIsUserLogged] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(false);

  const guestCount = parseInt(form.guests) || 2;
  const availableTables = tables.filter(t => t.available && t.capacity >= guestCount);

  // Get today's date for min attribute
  const today = new Date().toISOString().split('T')[0];

  // Generate hourly time slots (9 AM to 12 AM midnight)
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = 9 + i;
    const displayHour = hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 ? 'PM' : 'AM';
    const timeValue = `${String(hour).padStart(2, '0')}:00`;
    return { value: timeValue, label: `${displayHour}:00 ${period}` };
  });

  // Filter time slots if today is selected
  const availableTimeSlots = form.date === today ? 
    timeSlots.filter(slot => {
      const slotHour = parseInt(slot.value.split(':')[0]);
      const currentHour = new Date().getHours();
      return slotHour > currentHour;
    }) : 
    timeSlots;

  useEffect(() => {
    setIsAdminLogged(Boolean(localStorage.getItem("adminToken")));
    setIsUserLogged(Boolean(localStorage.getItem("userToken")));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !form.mobile) {
      setError("Please select a table and enter mobile number");
      return;
    }
    setShowOtpVerification(true);
    setOtp("");
    setError("");
  };

  const handleOtpVerification = async () => {
    if (loading) return;

    if (otp !== "1234") {
      setError("Invalid OTP. Please enter 1234.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const bookingData = {
        date: form.date,
        time: form.time,
        guests: guestCount,
        table: selectedTable,
        mobile: form.mobile
      };

      const token = localStorage.getItem("userToken");
      const res = await fetch(buildApiUrl("/bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (res.ok) {
        clearCart();
        setConfirmed(true);
        setShowOtpVerification(false);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to book table");
      }
    } catch (err) {
      setError("Network error. Please check 'My Bookings' to see if your reservation was created.");
    }
    setLoading(false);
  };

  if (!isUserLogged || isAdminLogged) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border rounded-3xl p-10 text-center max-w-lg w-full">
          <h1 className="text-3xl font-bold">Reservation access restricted</h1>
          <p className="text-muted-foreground mt-4">
            Only logged-in guests can reserve a table. Please login or register first.
          </p>
          {isAdminLogged ? (
            <p className="text-sm text-muted-foreground mt-2">Admin users cannot reserve tables here.</p>
          ) : null}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold hover:bg-primary/90">
              Login / Register
            </Link>
            <Link to="/" className="inline-flex items-center justify-center bg-muted text-muted-foreground px-6 py-3 rounded-full font-semibold hover:bg-muted/80">
              Back Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification Screen
  if (showOtpVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border rounded-3xl p-10 w-full max-w-md text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Verify OTP</h1>
            <p className="text-muted-foreground">Enter the OTP sent to {form.mobile}</p>
          </div>
          <input
            type="text"
            maxLength={4}
            placeholder="1234"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
          <div className="space-y-2">
            <button
              onClick={handleOtpVerification}
              disabled={!otp || loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              onClick={() => setShowOtpVerification(false)}
              className="w-full bg-muted text-muted-foreground py-3 rounded-xl font-semibold hover:bg-muted/80 transition-all"
            >
              Back
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Test OTP: 1234</p>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4 animate-in fade-in zoom-in">
          <CheckCircle className="h-20 w-20 text-accent mx-auto" />
          <h2 className="text-3xl font-bold">Reservation Confirmed!</h2>
          <p className="text-muted-foreground">
            Table for {form.guests} on {form.date} at {form.time}
          </p>
          <p className="text-sm text-muted-foreground">Selected table: {selectedTable}</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-all mt-4">
            Back Home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">Reserve a Table</h1>
          <p className="text-muted-foreground max-w-md mx-auto">Book your perfect dining experience with us</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Details */}
            <div className="bg-card border rounded-2xl p-6 space-y-5 h-fit">
              <h3 className="text-lg font-bold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Reservation Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Date</label>
                  <input 
                    type="date" 
                    required 
                    min={today}
                    value={form.date} 
                    onChange={e => setForm(p => ({ ...p, date: e.target.value, time: "" }))}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Time</label>
                  <select 
                    required 
                    value={form.time} 
                    onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Select time</option>
                    {availableTimeSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Guests</label>
                <select value={form.guests} onChange={e => { setForm(p => ({ ...p, guests: e.target.value })); setSelectedTable(null); }}
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit mobile number"
                  value={form.mobile}
                  onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <p className="text-xs text-muted-foreground">Required for OTP verification</p>
              </div>
            </div>

            {/* Tables */}
            <div className="bg-card border rounded-2xl p-6 space-y-5 h-fit">
              <h3 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Choose a Table</h3>
              <p className="text-sm text-muted-foreground">Select from available tables for your party size</p>
              {availableTables.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {availableTables.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTable(t.id)}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${
                        selectedTable === t.id
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="text-2xl font-bold">T{t.number}</div>
                      <div className="text-xs text-muted-foreground mt-1">Seats {t.capacity}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No tables available for {guestCount} guests</p>
              )}
              <button
                type="submit"
                disabled={!selectedTable || !form.date || !form.time || !form.mobile || loading}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? "Processing..." : "Verify & Proceed"}
              </button>
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            </div>

            {/* Menu Selection */}
            <div className="space-y-4">
              {/* Cart Items */}
              {cartItems.length > 0 && (
                <div className="bg-card border rounded-2xl p-6 space-y-4 border-primary/30 bg-primary/5">
                  <h3 className="text-lg font-bold">Selected Items ({cartItems.length})</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-background rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 hover:bg-muted rounded text-xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-semibold w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 hover:bg-muted rounded text-xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <div className="bg-card border rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-bold">Add Menu Items</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {menuItems.map(item => {
                    const cartItem = cartItems.find(ci => ci.id === item.id);
                    return (
                      <div key={item.id} className="flex items-start justify-between bg-background rounded-lg p-3 hover:shadow-md transition-shadow">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price}</p>
                        </div>
                        {cartItem ? (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, cartItem.quantity - 1)}
                              className="p-1 hover:bg-muted rounded text-xs"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-xs font-semibold w-5 text-center">{cartItem.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, cartItem.quantity + 1)}
                              className="p-1 hover:bg-muted rounded text-xs"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addItem(item)}
                            className="flex-shrink-0 p-1.5 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
