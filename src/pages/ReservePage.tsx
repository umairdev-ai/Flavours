import { useState } from "react";
import { CalendarDays, Users, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { tables } from "@/data/menuData";
import { Link } from "react-router-dom";
import { buildApiUrl } from "@/lib/api";

export default function ReservePage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", date: "", time: "", guests: "2" });
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const guestCount = parseInt(form.guests) || 2;
  const availableTables = tables.filter(t => t.available && t.capacity >= guestCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    setLoading(true);
    setError("");

    try {
      const bookingData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        date: form.date,
        time: form.time,
        guests: guestCount
      };

      const res = await fetch(buildApiUrl("/bookings"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      });

      if (res.ok) {
        setConfirmed(true);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to book table");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  if (confirmed) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4 animate-in fade-in zoom-in">
          <CheckCircle className="h-20 w-20 text-accent mx-auto" />
          <h2 className="text-3xl font-bold">Reservation Confirmed!</h2>
          <p className="text-muted-foreground">
            Table for {form.guests} on {form.date} at {form.time}
          </p>
          <p className="text-sm text-muted-foreground">Confirmation sent to {form.email}</p>
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
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Details */}
            <div className="bg-card border rounded-2xl p-6 space-y-5">
              <h3 className="text-lg font-bold flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Reservation Details</h3>
              {[
                { label: "Full Name", key: "name", type: "text", placeholder: "John Doe" },
                { label: "Email", key: "email", type: "email", placeholder: "john@example.com" },
                { label: "Phone", key: "phone", type: "tel", placeholder: "(555) 000-0000" },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-sm font-medium">{f.label}</label>
                  <input
                    type={f.type}
                    required
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Date</label>
                  <input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Time</label>
                  <input type="time" required value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Guests</label>
                <select value={form.guests} onChange={e => { setForm(p => ({ ...p, guests: e.target.value })); setSelectedTable(null); }}
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>)}
                </select>
              </div>
            </div>

            {/* Tables */}
            <div className="bg-card border rounded-2xl p-6 space-y-5">
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
                disabled={!selectedTable || loading}
                className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {loading ? "Booking..." : "Confirm Reservation"}
              </button>
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
