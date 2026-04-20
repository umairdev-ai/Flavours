import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, Loader2, Wallet } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

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
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  items?: BookingItem[];
}

export default function BookingPaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");

  const bookingTotal = useMemo(
    () => booking?.items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0,
    [booking]
  );

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("userToken");
        if (!token) {
          throw new Error("Please log in to continue.");
        }

        const res = await fetch(buildApiUrl("/bookings/my-bookings"), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load booking.");
        }

        const data: Booking[] = await res.json();
        const matchedBooking = data.find((entry) => entry._id === bookingId);

        if (!matchedBooking) {
          throw new Error("Booking not found.");
        }

        setBooking(matchedBooking);
      } catch (err: any) {
        setError(err.message || "Failed to load booking.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const processPaymentUpdate = async (paymentInfo: { method: string; id: string; status: string }) => {
    if (!booking) return;

    try {
      setPaymentLoading(true);
      setError("");

      const token = localStorage.getItem("userToken");
      const res = await fetch(buildApiUrl(`/bookings/${booking._id}/pay`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentMethod: paymentInfo.method,
          paymentId: paymentInfo.id,
          paymentStatus: paymentInfo.status,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update payment status.");
      }

      navigate("/bookings");
    } catch (err: any) {
      setError(err.message || "Failed to update payment status.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    if (!booking) return;

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey || razorpayKey === "YOUR_PUBLIC_KEY") {
      setError("Payment system configuration missing.");
      return;
    }

    setPaymentLoading(true);
    const loaded = await loadRazorpay();
    if (!loaded) {
      setPaymentLoading(false);
      setError("Failed to load payment gateway.");
      return;
    }

    try {
      const options = {
        key: razorpayKey,
        amount: Math.round(bookingTotal * 100),
        currency: "INR",
        name: "Mezbaan Restaurant",
        description: `Payment for Booking ${booking._id.slice(-8)}`,
        handler: (response: any) => {
          processPaymentUpdate({
            method: "Online (Razorpay)",
            id: response.razorpay_payment_id,
            status: "Completed",
          });
        },
        modal: {
          ondismiss: () => setPaymentLoading(false),
        },
        prefill: {
          name: localStorage.getItem("userName") || "",
          email: localStorage.getItem("userEmail") || "",
          contact: booking.mobile,
        },
        theme: { color: "#b45309" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      setError("Could not initiate payment.");
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-muted-foreground">Loading payment details...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border rounded-3xl p-8 w-full max-w-md text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Link to="/bookings" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = booking?.status === "cancelled";
  const alreadyPaid = booking?.paymentStatus === "Completed";

  if (!booking || isCancelled || alreadyPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border rounded-3xl p-8 w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">Payment not required</h1>
          <p className="text-muted-foreground">
            {isCancelled
              ? "This booking has been cancelled."
              : alreadyPaid
                ? "This booking is already paid."
                : "There is no pending payment for this booking."}
          </p>
          <Link to="/bookings" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link to="/bookings" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to My Bookings
        </Link>

        <div className="bg-card border rounded-3xl p-8 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Complete Payment</h1>
            <p className="text-muted-foreground">
              Finish payment for your booking on {new Date(booking.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} at {booking.time}
            </p>
          </div>

          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Pending Total</p>
              <p className="text-3xl font-bold text-primary">Rs. {bookingTotal}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{booking.guests} {booking.guests === 1 ? "Guest" : "Guests"}</p>
              <p>Table {booking.table.split("t")[1]}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRazorpayPayment}
              disabled={paymentLoading || bookingTotal <= 0}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary transition-all group disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary text-primary-foreground rounded-lg">
                  {paymentLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Pay Online Now</p>
                  <p className="text-xs text-muted-foreground">
                    {bookingTotal > 0 ? "Secure Razorpay payment" : "Online payment unavailable for this booking"}
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
            </button>

            <button
              onClick={() => processPaymentUpdate({ method: "Pay at Restaurant", id: "N/A", status: "Pending" })}
              disabled={paymentLoading}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-border hover:border-primary/50 transition-all group disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted text-muted-foreground rounded-lg">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Pay at Restaurant</p>
                  <p className="text-xs text-muted-foreground">Keep this booking unpaid for now</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          </div>

          {error && <p className="text-destructive text-sm text-center font-medium bg-destructive/10 p-3 rounded-xl">{error}</p>}
        </div>
      </div>
    </div>
  );
}
