import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed, CalendarDays, ShoppingBag, LayoutGrid, LogIn, LogOut } from "lucide-react";
import { menuItems as initialMenu, tables as initialTables, type MenuItem, type TableSlot } from "@/data/menuData";
import { buildApiUrl } from "@/lib/api";

type Tab = "menu" | "tables" | "orders" | "reservations";

interface Order {
  _id: string;
  userName: string;
  email: string;
  phone: string;
  items: { name: string; price: number; quantity: number }[];
  total: number;
  date: string;
}

interface Booking {
  _id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  createdAt: string;
}

const sampleOrders = [
  { id: "ORD-001", customer: "Sarah M.", items: 3, total: 1547, status: "Preparing", time: "2 min ago" },
  { id: "ORD-002", customer: "James R.", items: 1, total: 899, status: "Ready", time: "8 min ago" },
  { id: "ORD-003", customer: "Emily C.", items: 5, total: 2145, status: "Delivered", time: "25 min ago" },
];

const sampleReservations = [
  { id: "RES-001", name: "Michael B.", guests: 4, date: "2026-03-30", time: "19:00", table: "T3", status: "Confirmed" },
  { id: "RES-002", name: "Lisa W.", guests: 2, date: "2026-03-30", time: "20:00", table: "T1", status: "Confirmed" },
  { id: "RES-003", name: "David K.", guests: 6, date: "2026-03-31", time: "18:30", table: "T5", status: "Pending" },
];

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<Tab>("menu");
  const [menu, setMenu] = useState<MenuItem[]>(initialMenu);
  const [tablesList, setTablesList] = useState<TableSlot[]>(initialTables);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "Starters", image: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchData(storedToken);
    }
  }, []);

  const fetchData = async (authToken: string) => {
    setLoading(true);
    try {
      const [ordersRes, bookingsRes] = await Promise.all([
        fetch(buildApiUrl("/admin/orders"), {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        fetch(buildApiUrl("/admin/bookings"), {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch(buildApiUrl("/admin/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setIsLoggedIn(true);
        localStorage.setItem("adminToken", data.token);
        fetchData(data.token);
      } else {
        setLoginError(data.message || "Login failed");
      }
    } catch (error) {
      setLoginError("Network error");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    localStorage.removeItem("adminToken");
    setOrders([]);
    setBookings([]);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "tables", label: "Tables", icon: LayoutGrid },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "reservations", label: "Reservations", icon: CalendarDays },
  ];

  const handleSaveItem = () => {
    if (!form.name || !form.price) return;
    if (editingItem) {
      setMenu(prev => prev.map(i => i.id === editingItem.id ? { ...i, name: form.name, description: form.description, price: parseFloat(form.price), category: form.category, image: form.image || i.image } : i));
    } else {
      const newItem: MenuItem = { id: Date.now().toString(), name: form.name, description: form.description, price: parseFloat(form.price), category: form.category, image: form.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop" };
      setMenu(prev => [...prev, newItem]);
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({ name: "", description: "", price: "", category: "Starters", image: "" });
    setEditingItem(null);
    setShowForm(false);
  };

  const startEdit = (item: MenuItem) => {
    setForm({ name: item.name, description: item.description, price: item.price.toString(), category: item.category, image: item.image });
    setEditingItem(item);
    setShowForm(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="bg-card border rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground">Access the admin dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={e => setLoginForm(p => ({ ...p, username: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                required
                value={loginForm.password}
                onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                placeholder="Enter password"
              />
            </div>
            {loginError && <p className="text-destructive text-sm">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-semibold hover:bg-primary/90 transition-all"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your restaurant</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Menu Tab */}
        {tab === "menu" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Menu Items ({menu.length})</h2>
              <button onClick={() => { resetForm(); setShowForm(true); }}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition-all">
                <Plus className="h-4 w-4" /> Add Item
              </button>
            </div>

            {showForm && (
              <div className="bg-card border rounded-2xl p-6 space-y-4 animate-in slide-in-from-top-2">
                <h3 className="font-bold">{editingItem ? "Edit Item" : "New Item"}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <input placeholder="Price" type="number" step="0.01" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                    {["Starters", "Main Course", "Desserts", "Drinks"].map(c => <option key={c}>{c}</option>)}
                  </select>
                  <input placeholder="Image URL (optional)" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                    className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" rows={2} />
                <div className="flex gap-3">
                  <button onClick={handleSaveItem} className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">Save</button>
                  <button onClick={resetForm} className="bg-muted text-muted-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-muted/80">Cancel</button>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {menu.map(item => (
                <div key={item.id} className="flex items-center gap-4 bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
                  <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.category} · ₹{item.price}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item)} className="p-2 hover:bg-muted rounded-lg transition-colors"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setMenu(prev => prev.filter(i => i.id !== item.id))} className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tables Tab */}
        {tab === "tables" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Tables ({tablesList.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {tablesList.map(t => (
                <div key={t.id} className={`bg-card border rounded-xl p-5 text-center space-y-2 ${!t.available ? "opacity-60" : ""}`}>
                  <div className="text-2xl font-bold">T{t.number}</div>
                  <div className="text-xs text-muted-foreground">Seats {t.capacity}</div>
                  <button
                    onClick={() => setTablesList(prev => prev.map(tb => tb.id === t.id ? { ...tb, available: !tb.available } : tb))}
                    className={`w-full py-1.5 rounded-lg text-xs font-medium transition-all ${
                      t.available ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                    }`}>
                    {t.available ? "Available" : "Occupied"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Recent Orders ({orders.length})</h2>
            {loading ? (
              <p className="text-center py-8">Loading orders...</p>
            ) : orders.length > 0 ? (
              <div className="grid gap-3">
                {orders.map(o => (
                  <div key={o._id} className="flex items-center justify-between bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold">{o._id.slice(-8)}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-secondary/20 text-secondary-foreground">
                          New
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {o.userName} · {o.email} · {o.items.length} items · {new Date(o.date).toLocaleString()}
                      </p>
                    </div>
                    <span className="font-bold text-primary">₹{o.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No orders yet</p>
            )}
          </div>
        )}

        {/* Reservations Tab */}
        {tab === "reservations" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Reservations ({bookings.length})</h2>
            {loading ? (
              <p className="text-center py-8">Loading reservations...</p>
            ) : bookings.length > 0 ? (
              <div className="grid gap-3">
                {bookings.map(r => (
                  <div key={r._id} className="flex items-center justify-between bg-card border rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold">{r._id.slice(-8)}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-accent/20 text-accent">
                          Confirmed
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {r.name} · {r.email} · {r.guests} guests · {r.date} at {r.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No reservations yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
