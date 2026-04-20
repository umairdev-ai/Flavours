import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, CalendarDays, Clock, Users, Trash2, ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";
import { buildApiUrl } from "@/lib/api";
import type { MenuItem } from "@/data/menuData";

interface BookingItem {
  name: string;
  price: number;
  quantity: number;
}

interface Booking {
  _id: string;
  date: string;
  time: string;
  guests: number;
  table: string;
  mobile: string;
  createdAt: string;
  status?: string;
  cancellationNote?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  items?: BookingItem[];
  baseAmount?: number;
  surchargeAmount?: number;
  totalAmount?: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [menuLookup, setMenuLookup] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
    loadMenuAvailability();
  }, []);

  const loadMenuAvailability = () => {
    try {
      const saved = localStorage.getItem("menuItems");
      if (!saved) return;
      const menuItems: MenuItem[] = JSON.parse(saved);
      const nextLookup = menuItems.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.name.toLowerCase()] = item.available !== false;
        return acc;
      }, {});
      setMenuLookup(nextLookup);
    } catch {
      setMenuLookup({});
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("userToken");
      if (!token) {
        setError("Not logged in");
        return;
      }

      const res = await fetch(buildApiUrl("/bookings/my-bookings"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch bookings");
      }

      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      setCancellingId(bookingId);
      const token = localStorage.getItem("userToken");
      const res = await fetch(buildApiUrl(`/bookings/${bookingId}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to cancel booking");
      }

      setBookings(
        bookings.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: "cancelled", cancellationNote: "Cancelled by guest" }
            : booking
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to cancel booking");
    } finally {
      setCancellingId(null);
    }
  };

  const isUpcoming = (bookingDate: string, bookingTime: string): boolean => {
    const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
    return bookingDateTime > new Date();
  };

  const canCancel = (date: string, time: string) => {
    const bookingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const hours = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hours >= 48;
  };

  const renderBookedItems = (booking: Booking) => {
    const items = booking.items || [];
    if (items.length === 0) return null;

    const subtotal = booking.baseAmount ?? items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const surcharge = booking.surchargeAmount ?? 0;
    const total = booking.totalAmount ?? (subtotal + surcharge);
    const isPaid = ["completed", "paid"].includes((booking.paymentStatus || "").toLowerCase());

    return (
      <div className="space-y-4 pt-6 border-t border-dashed border-primary/10">
        <div className="flex items-center justify-between border-b border-primary/5 pb-2">
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Order Summary</p>
          <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full">{items.length} Items</span>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => {
            const isAvailable = menuLookup[item.name.toLowerCase()] ?? true;
            return (
              <div key={idx} className="flex justify-between items-start text-xs">
                <div className="flex-1 min-w-0 pr-4">
                  <span className="font-bold text-foreground block truncate">{item.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {item.quantity} × Rs. {item.price}
                  </span>
                  {!isAvailable && <p className="text-[9px] font-bold uppercase text-amber-600">Unavailable</p>}
                </div>
                <span className="font-bold text-foreground/90">Rs. {item.price * item.quantity}</span>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-dashed border-primary/10 space-y-1.5">
          <div className="flex justify-between text-[11px] text-muted-foreground font-medium">
            <span>Subtotal</span>
            <span>Rs. {subtotal}</span>
          </div>
          {surcharge > 0 && (
            <div className="flex justify-between text-[11px] text-amber-700 font-bold italic">
              <span>Rush Surcharge (20%)</span>
              <span>Rs. {surcharge}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-black text-primary pt-1 border-t border-primary/5 mt-1">
            <span>Grand Total</span>
            <span>Rs. {total}</span>
          </div>
          {total > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200/50 p-3 rounded-2xl">
              {isPaid ? (
                <p className="text-[10px] font-bold text-green-700 text-center uppercase tracking-wider leading-tight flex items-center justify-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Paid - Thank You!
                </p>
              ) : (
                <p className="text-[10px] font-bold text-amber-800 text-center italic uppercase tracking-wider leading-tight">
                  Payment will be done while visiting restaurant
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const upcomingBookings = bookings.filter((booking) => isUpcoming(booking.date, booking.time));
  const pastBookings = bookings.filter((booking) => !isUpcoming(booking.date, booking.time));
  const cancelledCount = bookings.filter((booking) => booking.status === "cancelled").length;

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/reserve" className="p-2 hover:bg-muted rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold">My Bookings</h1>
              <p className="text-muted-foreground mt-2 font-medium">Your digital reservation tickets for Mezbaan</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6 text-center">
            <p className="text-destructive">{error}</p>
            <button
              onClick={fetchBookings}
              className="mt-4 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <h2 className="text-2xl font-bold">No bookings yet</h2>
            <p className="text-muted-foreground">You haven't made any table reservations yet</p>
            <Link
              to="/reserve"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-full font-semibold hover:bg-primary/90 transition-all mt-4"
            >
              Book a Table
            </Link>
          </div>
        ) : (
          <div className="space-y-12 max-w-4xl mx-auto">
            {cancelledCount > 3 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-amber-900 font-bold">Frequent Cancellation Warning</h3>
                  <p className="text-amber-800/80 text-sm mt-1">
                    You have cancelled {cancelledCount} bookings. Please note that excessive cancellations may lead to your account being restricted from future reservations.
                  </p>
                </div>
              </div>
            )}

            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  Upcoming Bookings ({upcomingBookings.length})
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => {
                    const isAdminCancelled = booking.status === "cancelled";
                    const isPaid = ["completed", "paid"].includes((booking.paymentStatus || "").toLowerCase());
                    const total = booking.totalAmount ?? ((booking.baseAmount ?? (booking.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0)) + (booking.surchargeAmount || 0));

                    return (
                      <div
                        key={booking._id}
                        className={`max-w-2xl mx-auto w-full bg-card border rounded-[2.5rem] shadow-xl overflow-hidden transition-all hover:shadow-2xl ${isAdminCancelled ? "opacity-75 grayscale" : ""}`}
                      >
                        <div className={`${isAdminCancelled ? "bg-muted" : "bg-primary"} p-6 text-center text-primary-foreground relative`}>
                          <div className="flex items-center justify-center gap-2">
                            {isAdminCancelled ? <AlertTriangle className="h-6 w-6" /> : <CheckCircle className="h-6 w-6" />}
                            <h3 className="text-xl font-bold uppercase tracking-tight">{isAdminCancelled ? "Ticket Cancelled" : "Valid Reservation"}</h3>
                          </div>
                          <p className="text-[10px] opacity-70 font-mono mt-1 uppercase tracking-widest">ID: {booking._id.slice(-8)}</p>
                        </div>

                        <div className="p-8 space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                              <div className="space-y-3">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Schedule Details</p>
                                <div className="space-y-2.5">
                                  <div className="flex items-center gap-3 text-sm font-bold">
                                    <CalendarDays className="h-4 w-4 text-primary" /> 
                                    {new Date(booking.date).toLocaleDateString("en-IN", { dateStyle: "full" })}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm font-bold">
                                    <Clock className="h-4 w-4 text-primary" /> {booking.time}
                                  </div>
                                  <div className="flex items-center gap-3 text-sm font-bold">
                                    <Users className="h-4 w-4 text-primary" /> {booking.guests} Guests
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-1.5 pt-2">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Reserved For</p>
                                <p className="text-sm font-extrabold uppercase">{localStorage.getItem("userName") || "Guest"}</p>
                                <p className="text-xs text-muted-foreground font-medium">{booking.mobile}</p>
                              </div>

                              {!isAdminCancelled && (
                                <div className="space-y-1.5 pt-2 border-t border-primary/5">
                                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-[0.2em]">Payment Information</p>
                                  <div className="flex flex-col gap-1">
                                    <p className="text-xs font-semibold">{booking.paymentMethod || "At Restaurant"}</p>
                                    <div className="flex items-center gap-2">
                                      <p className={`text-[10px] font-bold ${isPaid ? "text-green-600" : "text-amber-600"}`}>
                                        {isPaid ? "Paid" : "Pending"}
                                      </p>
                                      <p className="text-xs font-bold text-foreground">Rs. {total}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-center justify-center bg-primary/5 rounded-[2.5rem] p-8 border-2 border-dashed border-primary/20 shadow-inner">
                              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 opacity-60">Allotted Table</p>
                              <p className="text-6xl font-black text-primary tracking-tighter">T-{booking.table.split("t")[1] || booking.table}</p>
                            </div>
                          </div>

                          {renderBookedItems(booking)}

                          {isAdminCancelled && (
                            <div className="bg-destructive/5 border border-destructive/10 rounded-2xl p-5 mt-4">
                              <p className="text-[10px] uppercase font-bold text-destructive tracking-widest mb-1">Cancellation Reason</p>
                              <p className="text-sm text-destructive/80 font-medium italic">"{booking.cancellationNote || "Cancelled by restaurant management"}"</p>
                            </div>
                          )}
                        </div>

                        {!isAdminCancelled && (
                          <div className="px-8 pb-8 flex flex-col gap-3">
                            <button
                              onClick={() => handleCancelBooking(booking._id)}
                              disabled={cancellingId === booking._id || !canCancel(booking.date, booking.time)}
                              className="w-full bg-destructive/10 text-destructive hover:bg-destructive text-destructive-foreground border border-destructive/20 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              {cancellingId === booking._id ? "Processing..." : "Cancel Reservation"}
                            </button>
                            {!canCancel(booking.date, booking.time) && (
                              <p className="text-[10px] text-center text-muted-foreground font-bold bg-muted/40 py-3 rounded-xl uppercase tracking-widest">
                                Ticket Locked: 48h Window Passed
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                  Past Bookings ({pastBookings.length})
                </h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => {
                    const isPaid = ["completed", "paid"].includes((booking.paymentStatus || "").toLowerCase());
                    const total = booking.totalAmount ?? ((booking.baseAmount ?? (booking.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0)) + (booking.surchargeAmount || 0));
                    return (
                      <div 
                        key={booking._id} 
                        className="max-w-2xl mx-auto w-full bg-card border rounded-[2.5rem] overflow-hidden opacity-60 grayscale-[0.5] hover:opacity-100 transition-all hover:grayscale-0 shadow-md"
                      >
                        <div className="bg-muted p-5 flex justify-between items-center px-8">
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Past Reservation</p>
                          <p className="text-[10px] font-mono opacity-50 uppercase">ID: {booking._id.slice(-8)}</p>
                        </div>
                        <div className="p-8">
                          <div className="flex justify-between items-center bg-muted/30 p-5 rounded-2xl border border-dashed mb-6">
                            <div className="text-sm font-bold flex flex-wrap gap-x-4 gap-y-1">
                              <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {new Date(booking.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                              <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> {booking.time}</span>
                              <span className="flex items-center gap-2"><Users className="h-3.5 w-3.5" /> {booking.guests} Guests</span>
                            </div>
                            <p className="text-xl font-black text-muted-foreground">T-{booking.table.split("t")[1] || booking.table}</p>
                          </div>
                          <div className="mb-6 px-5 py-3 bg-muted/20 rounded-xl border border-muted flex items-center justify-between">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Payment Status</span>
                            <span className={`text-xs font-bold ${isPaid ? "text-green-600" : "text-amber-600"}`}>
                              {isPaid ? "Paid" : "Pay at Restaurant"} (Rs. {total})
                            </span>
                          </div>
                          {renderBookedItems(booking)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
