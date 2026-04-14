import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Users, Phone, Trash2, ArrowLeft } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

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
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

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
          "Authorization": `Bearer ${token}`
        }
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
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to cancel booking");
      }

      setBookings(bookings.filter(b => b._id !== bookingId));
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

  const upcomingBookings = bookings.filter(b => isUpcoming(b.date, b.time));
  const pastBookings = bookings.filter(b => !isUpcoming(b.date, b.time));

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
              <p className="text-muted-foreground mt-2">View and manage your table reservations</p>
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
            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-primary" />
                  Upcoming Bookings ({upcomingBookings.length})
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map(booking => {
                    const isAdminCancelled = booking.status === "cancelled";
                    return (
                    <div key={booking._id} className={`bg-card rounded-2xl p-6 hover:shadow-lg transition-shadow ${isAdminCancelled ? "border border-destructive/40 opacity-80" : "border border-primary/30"}`}>
                      {isAdminCancelled && (
                        <div className="mb-4 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
                          <p className="text-sm font-semibold text-destructive">⚠ Reservation Cancelled by Restaurant</p>
                          {booking.cancellationNote && (
                            <p className="text-sm text-destructive/80 mt-1">{booking.cancellationNote}</p>
                          )}
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Calendar className={`h-5 w-5 ${isAdminCancelled ? "text-muted-foreground" : "text-primary"}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold">{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className={`h-5 w-5 ${isAdminCancelled ? "text-muted-foreground" : "text-primary"}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Time</p>
                              <p className="font-semibold">{booking.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Users className={`h-5 w-5 ${isAdminCancelled ? "text-muted-foreground" : "text-primary"}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Guests</p>
                              <p className="font-semibold">{booking.guests} {booking.guests === 1 ? "Guest" : "Guests"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className={`rounded-lg p-4 ${isAdminCancelled ? "bg-muted" : "bg-primary/10"}`}>
                            <p className="text-xs text-muted-foreground">Table Number</p>
                            <p className={`text-3xl font-bold ${isAdminCancelled ? "text-muted-foreground" : "text-primary"}`}>Table {booking.table.split('t')[1]}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className={`h-5 w-5 ${isAdminCancelled ? "text-muted-foreground" : "text-primary"}`} />
                            <div>
                              <p className="text-xs text-muted-foreground">Mobile</p>
                              <p className="font-semibold">{booking.mobile}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {!isAdminCancelled && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          disabled={cancellingId === booking._id}
                          className="mt-6 w-full bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 py-2.5 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          {cancellingId === booking._id ? "Cancelling..." : "Cancel Booking"}
                        </button>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past Bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                  Past Bookings ({pastBookings.length})
                </h2>
                <div className="space-y-4">
                  {pastBookings.map(booking => (
                    <div key={booking._id} className="bg-card border rounded-2xl p-6 opacity-75 hover:opacity-100 transition-opacity">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="font-semibold">{new Date(booking.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Time</p>
                              <p className="font-semibold">{booking.time}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Guests</p>
                              <p className="font-semibold">{booking.guests} {booking.guests === 1 ? "Guest" : "Guests"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="bg-muted rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">Table Number</p>
                            <p className="text-3xl font-bold text-muted-foreground">Table {booking.table.split('t')[1]}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Mobile</p>
                              <p className="font-semibold">{booking.mobile}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-6">Booking past</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
