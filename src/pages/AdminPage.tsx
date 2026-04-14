import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, UtensilsCrossed, CalendarDays, LayoutGrid, LogIn, LogOut, XCircle } from "lucide-react";
import { menuItems as initialMenu, tables as initialTables, type MenuItem, type TableSlot } from "@/data/menuData";
import { buildApiUrl } from "@/lib/api";

type Tab = "menu" | "tables" | "reservations";

interface Booking {
  _id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  createdAt: string;
  status?: string;
  cancellationNote?: string;
}

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
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [formError, setFormError] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [cancelModalId, setCancelModalId] = useState<string | null>(null);
  const [cancelNote, setCancelNote] = useState("");
  const [cancelling, setCancelling] = useState(false);

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
      const bookingsRes = await fetch(buildApiUrl("/admin/bookings"), {
        headers: { Authorization: `Bearer ${authToken}` }
      });
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
        window.dispatchEvent(new Event("authChanged"));
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
    window.dispatchEvent(new Event("authChanged"));
    setBookings([]);
  };

  const handleAdminCancelBooking = async () => {
    if (!cancelModalId || !token) return;
    setCancelling(true);
    try {
      const res = await fetch(buildApiUrl(`/admin/bookings/${cancelModalId}/cancel`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ cancellationNote: cancelNote.trim() })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b =>
          b._id === cancelModalId
            ? { ...b, status: "cancelled", cancellationNote: cancelNote.trim() }
            : b
        ));
        setCancelModalId(null);
        setCancelNote("");
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
    setCancelling(false);
  };

  const uploadImageFile = async (file: File) => {
    if (!token) return;
    setUploading(true);
    setUploadError("");
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(buildApiUrl("/admin/upload-image"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Upload failed");
      }
      setForm(prev => ({ ...prev, image: data.imageUrl }));
    } catch (error: any) {
      setUploadError(error.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDropImage = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadImageFile(file);
    }
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, image: "" }));
    setUploadError("");
    setFormError("");
  };

  const validateForm = () => {
    if (!form.name.trim() || !form.description.trim() || !form.price.trim() || !form.category.trim() || !form.image.trim()) {
      setFormError("Please fill all fields and upload an image.");
      return false;
    }

    const priceValue = Number(form.price);
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      setFormError("Price must be a valid positive number.");
      return false;
    }

    return true;
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "tables", label: "Tables", icon: LayoutGrid },
    { id: "reservations", label: "Reservations", icon: CalendarDays },
  ];

  const handleSaveItem = () => {
    setFormError("");
    if (!validateForm()) return;
    if (editingItem) {
      setMenu(prev => prev.map(i => i.id === editingItem.id ? { ...i, name: form.name, description: form.description, price: parseFloat(form.price), category: form.category, image: form.image || i.image } : i));
    } else {
      const newItem: MenuItem = { id: Date.now().toString(), name: form.name, description: form.description, price: parseFloat(form.price), category: form.category, image: form.image };
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
                  <div
                    className={`rounded-2xl border border-dashed p-4 ${dragActive ? "border-primary bg-primary/5" : "border-muted bg-background"}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDropImage}
                  >
                    <label className="text-sm font-medium">Upload an image</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload}
                      className="mt-2 w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-primary-foreground" />
                    <p className="text-xs text-muted-foreground mt-2">Drag & drop an image here, or click to choose a file.</p>
                    {uploading && <p className="text-sm text-muted-foreground mt-2">Uploading image...</p>}
                    {uploadError && <p className="text-sm text-destructive mt-2">{uploadError}</p>}
                  </div>
                </div>
                <input placeholder="Image URL (optional)" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
                {form.image && (
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <img src={form.image} alt="Preview" className="w-24 h-24 rounded-lg object-cover border" />
                    <div className="flex gap-2">
                      <button type="button" onClick={removeImage}
                        className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-destructive/90">
                        Remove image
                      </button>
                    </div>
                  </div>
                )}
                {formError && <p className="text-sm text-destructive">{formError}</p>}
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

        {/* Reservations Tab */}
        {tab === "reservations" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Reservations ({bookings.length})</h2>
            {loading ? (
              <p className="text-center py-8">Loading reservations...</p>
            ) : bookings.length > 0 ? (
              <div className="grid gap-3">
                {bookings.map(r => {
                  const isCancelled = r.status === "cancelled";
                  return (
                    <div key={r._id} className={`bg-card border rounded-xl p-5 hover:shadow-md transition-shadow ${isCancelled ? "opacity-60" : ""}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-sm font-bold">{r._id.slice(-8)}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isCancelled
                                ? "bg-destructive/20 text-destructive"
                                : "bg-accent/20 text-accent"
                            }`}>
                              {isCancelled ? "Cancelled" : "Confirmed"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {r.name} · {r.email} · {r.guests} guests · {r.date} at {r.time}
                          </p>
                          {isCancelled && r.cancellationNote && (
                            <p className="text-xs text-destructive mt-1.5 italic">Note: {r.cancellationNote}</p>
                          )}
                        </div>
                        {!isCancelled && (
                          <button
                            onClick={() => { setCancelModalId(r._id); setCancelNote(""); }}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No reservations yet</p>
            )}
          </div>
        )}

        {/* Cancel with Note Modal */}
        {cancelModalId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
            <div className="bg-card border rounded-2xl p-6 w-full max-w-md space-y-4 animate-in fade-in zoom-in">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" /> Cancel Reservation
              </h3>
              <p className="text-sm text-muted-foreground">Add a note explaining the cancellation. This will be shown to the guest in their bookings.</p>
              <textarea
                value={cancelNote}
                onChange={e => setCancelNote(e.target.value)}
                placeholder="e.g. Restaurant closed for a private event on this date..."
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/50 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleAdminCancelBooking}
                  disabled={cancelling || !cancelNote.trim()}
                  className="flex-1 bg-destructive text-destructive-foreground py-2.5 rounded-lg font-semibold hover:bg-destructive/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
                <button
                  onClick={() => { setCancelModalId(null); setCancelNote(""); }}
                  className="flex-1 bg-muted text-muted-foreground py-2.5 rounded-lg font-semibold hover:bg-muted/80 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
