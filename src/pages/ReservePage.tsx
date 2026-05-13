import { useEffect, useState } from "react";
import { CalendarDays, Users, Clock, CheckCircle, ArrowRight, Plus, Minus, Trash2, CreditCard, Wallet, AlertTriangle } from "lucide-react";
import { tables } from "@/data/menuData";
import { Link } from "react-router-dom";
import { buildApiUrl } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function ReservePage() {
  const { items: cartItems, updateQuantity, removeItem, clearCart } = useCart();
  const [form, setForm] = useState({ date: "", time: "", guests: "2", mobile: "" });
  const [allottedTableNo, setAllottedTableNo] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [bookedItems, setBookedItems] = useState<any[]>([]);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [paymentInfo, setPaymentDetails] = useState({ method: "Pay at Restaurant", id: "", status: "Pending" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUserLogged, setIsUserLogged] = useState(false);
  const [isAdminLogged, setIsAdminLogged] = useState(false);
  const [showNoItemsAlert, setShowNoItemsAlert] = useState(false);

  const TABLE_RATE_PER_GUEST = 200;
  const guestCount = parseInt(form.guests) || 2;
  const tableCharge = guestCount * TABLE_RATE_PER_GUEST;
  const availableTables = tables
    .filter(t => t.available && t.capacity >= guestCount)
    .sort((a, b) => a.capacity - b.capacity || a.number - b.number);
  const selectedTable = availableTables[0] ?? null;
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayDate = new Date();
  const today = formatDateInput(todayDate);
  const maxBookingDateObj = new Date(todayDate);
  maxBookingDateObj.setMonth(maxBookingDateObj.getMonth() + 1);
  const maxBookingDate = formatDateInput(maxBookingDateObj);

  const getBookingLeadDays = (bookingDate: string) => {
    if (!bookingDate) return null;
    const selectedDate = new Date(`${bookingDate}T00:00:00`);
    const todayStart = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
    return Math.round((selectedDate.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
  };

  const bookingLeadDays = getBookingLeadDays(form.date);
  const rushBookingApplies = bookingLeadDays === 0 || bookingLeadDays === 1;
  const surchargeAmount = rushBookingApplies ? Math.round(subtotal * 0.2) : 0;
  const totalBeforeSurcharge = subtotal + tableCharge;
  const totalWithSurcharge = totalBeforeSurcharge + surchargeAmount;

  const timeSlotHours = [7, 9, 11, 13, 15, 17, 19, 21, 23, 1];
  const timeSlots = timeSlotHours.map((hour) => {
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const period = hour >= 12 && hour !== 1 ? "PM" : "AM";
    const timeValue = `${String(hour).padStart(2, "0")}:00`;
    return { value: timeValue, label: `${displayHour}:00 ${period}` };
  });

  const availableTimeSlots = timeSlots.filter((slot) => {
    const slotHour = parseInt(slot.value.split(":")[0], 10);
    const slotDateTime = new Date(`${form.date}T${slot.value}:00`);
    const now = new Date();
    const diffInHours = (slotDateTime - now) / (1000 * 60 * 60);
    return diffInHours >= 6;
  });

  useEffect(() => {
    setIsAdminLogged(Boolean(localStorage.getItem("adminToken")));
    setIsUserLogged(Boolean(localStorage.getItem("userToken")));
  }, []);

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

  const handleRazorpayPayment = async () => {
    setError("");
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

    console.log("Razorpay Key ID detected:", razorpayKey);
    console.log("--- Razorpay Debug ---");
    console.log("Vite Mode:", import.meta.env.MODE);
    console.log("Key ID Value:", razorpayKey ? "STATED (HIDDEN)" : "UNDEFINED/MISSING");
    console.log("Raw Key ID:", razorpayKey); 
    console.log("Attempting payment for amount:", totalWithSurcharge);

    if (!razorpayKey || razorpayKey === "YOUR_PUBLIC_KEY" || razorpayKey.length < 5) {
      const msg = "Razorpay Key ID not found. Your .env file MUST be in the 'dine-delight' root folder, NOT in a subfolder like 'auth system'. Please move it and restart the server.";
      setError(msg);
      console.error("Razorpay Config Error:", msg);
      return;
    }

    setLoading(true);
    const res = await loadRazorpay();
    if (!res) {
      setError("Razorpay SDK failed to load. Are you online?");
      setLoading(false);
      return;
    }

    try {
      const options = {
        key: razorpayKey, 
        amount: Math.round(totalWithSurcharge * 100), // Amount in paise
        currency: "INR",
        name: "Mezbaan Restaurant",
        description: `Table Reservation for ${form.guests} Guests`,
        handler: function (response: any) {
          setPaymentDetails({
            method: "Online (Razorpay)",
            id: response.razorpay_payment_id,
            status: "Completed"
          });
          processBooking({ 
            method: "Online (Razorpay)", 
            id: response.razorpay_payment_id, 
            status: "Completed" 
          });
        },
        modal: {
          ondismiss: function() {
            console.log("Payment modal closed by user");
            setError("Payment window closed.");
            setLoading(false);
          }
        },
        prefill: {
          name: localStorage.getItem("userName") || "",
          email: localStorage.getItem("userEmail") || "",
          contact: form.mobile
        },
        theme: { color: "#b45309" },
      };

      const rzp = new (window as any).Razorpay(options);
      
      rzp.on('payment.failed', function (response: any) {
        console.error("Razorpay Payment Failed Object:", response.error);
        setError(response.error.description || "Payment failed. Please try again.");
        setLoading(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Razorpay Modal Error:", err);
      setError("Could not open payment window. Check if your Key ID is correct.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mobile || !form.date || !form.time) {
      setError("Please fill all reservation details");
      return;
    }

    // If no menu items selected, ask for confirmation
    if (cartItems.length === 0) {
      setShowNoItemsAlert(true);
      return;
    }

    // If user has pre-ordered items, show payment choice.
    // Otherwise, proceed directly to booking as there's nothing to pay for.
    if (totalWithSurcharge > 0) {
      setShowPaymentChoice(true);
    } else {
      await processBooking({ method: "None (Reservation Only)", id: "N/A", status: "N/A" });
    }
  };

  const processBooking = async (pInfo = paymentInfo) => {
    if (loading) return;
    
    if (!selectedTable) {
      setError("No tables available for the selected party size. Try a different date, time, or guest count.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("userToken");

      if (!token) {
        throw new Error("Your session has expired. Please login again.");
      }

      const userName = localStorage.getItem("userName");

      const bookingData = {
        date: form.date,
        time: form.time,
        guests: guestCount,
        table: selectedTable.id,
        mobile: form.mobile,
        name: userName || "Guest",
        items: cartItems.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        tableCharge,
        paymentMethod: pInfo.method,
        paymentId: pInfo.id,
        paymentStatus: pInfo.status
      };

      const res = await fetch(buildApiUrl("/bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bookingData)
      });

      if (res.ok) {
        setBookedItems([...cartItems]);
        clearCart();
        setAllottedTableNo(selectedTable.number);
        setPaymentDetails(pInfo);
        setConfirmed(true);
        setShowPaymentChoice(false);
      } else {
        const data = await res.json();
        const msg = data.message?.toLowerCase() || "";
        if (msg.includes("token") || msg.includes("invalid") || msg.includes("expired")) {
          setError("Session error. Please logout and login again.");
        } else {
          setError(data.message || "Failed to book table");
        }
      }
    } catch (err: any) {
      setError(err.message === "token is invalid" ? "Session expired. Please re-login." : (err.message || "An unexpected error occurred."));
    } finally {
      setLoading(false);
    }
  };

  if (showPaymentChoice) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border rounded-3xl p-8 w-full max-w-md space-y-6 animate-in fade-in zoom-in">
                    <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Payment Method</h2>
            <p className="text-sm text-muted-foreground">Select how you'd like to pay for your table reservation and pre-ordered items (Rs. {totalWithSurcharge})</p>
          </div>

          {rushBookingApplies && subtotal > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Rush booking pricing applied. Same-day and next-day reservations include a 20% surcharge of Rs. {surchargeAmount}.
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleRazorpayPayment}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-primary/20 bg-primary/5 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary text-primary-foreground rounded-lg"><CreditCard className="h-5 w-5" /></div>
                <div className="text-left">
                  <p className="font-bold text-sm">Pay Online Now</p>
                  <p className="text-xs text-muted-foreground">Secure payment via Razorpay</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
            </button>

            <button
              onClick={() => processBooking({ method: "Pay at Restaurant", id: "N/A", status: "Pending" })}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-border hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted text-muted-foreground rounded-lg"><Wallet className="h-5 w-5" /></div>
                <div className="text-left">
                  <p className="font-bold text-sm">Pay at Restaurant</p>
                  <p className="text-xs text-muted-foreground">Complete payment during your visit</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
            </button>
          </div>

          {loading && <p className="text-center text-sm text-primary animate-pulse">Opening Razorpay...</p>}
          {error && <p className="text-destructive text-sm text-center font-medium bg-destructive/10 p-3 rounded-xl animate-in shake-in">{error}</p>}

          <button onClick={() => { setShowPaymentChoice(false); setError(""); }} className="w-full text-xs text-muted-foreground hover:underline">Back to Details</button>
        </div>
      </div>
    );
  }

  if (showNoItemsAlert) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="bg-card border rounded-3xl p-8 w-full max-w-md space-y-6 animate-in fade-in zoom-in">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold">No Menu Items Selected</h2>
            <p className="text-muted-foreground">You're booking a table without pre-ordering any menu items. You can still order when you arrive at the restaurant.</p>
            <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">Table charges will be collected upon your visit.</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={async () => {
                setShowNoItemsAlert(false);
                await processBooking({ method: "Pay at Restaurant", id: "N/A", status: "Pending" });
              }}
              className="w-full bg-primary text-primary-foreground py-3 rounded-2xl font-bold hover:bg-primary/90 transition-all"
            >
              Yes, Book Table Only
            </button>

            <button
              onClick={() => {
                setShowNoItemsAlert(false);
                // Navigate to menu page
                window.location.href = '/menu';
              }}
              className="w-full bg-secondary text-secondary-foreground py-3 rounded-2xl font-bold hover:bg-secondary/80 transition-all"
            >
              No, Add Menu Items First
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="max-w-2xl w-full bg-card border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="bg-primary p-8 text-center text-primary-foreground relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent scale-150" />
            <CheckCircle className="h-16 w-16 mx-auto mb-4 relative z-10" />
            <h2 className="text-3xl font-extrabold relative z-10">Reservation Confirmed!</h2>
            <p className="opacity-90 relative z-10 mt-1 font-medium">We've saved a spot for you at Mezbaan</p>
          </div>
          
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-5">
                <div className="space-y-2">
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Reservation Details</p>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2.5 text-sm font-semibold">
                        <CalendarDays className="h-4 w-4 text-primary" /> {new Date(form.date).toLocaleDateString('en-IN', { dateStyle: 'full' })}
                      </div>
                      <div className="flex items-center gap-2.5 text-sm font-semibold">
                        <Clock className="h-4 w-4 text-primary" /> {timeSlots.find(s => s.value === form.time)?.label || form.time}
                      </div>
                      <div className="flex items-center gap-2.5 text-sm font-semibold">
                        <Users className="h-4 w-4 text-primary" /> {form.guests} {parseInt(form.guests) === 1 ? 'Guest' : 'Guests'}
                      </div>
                   </div>
                </div>
                
                <div className="space-y-1">
                   <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Customer Info</p>
                   <p className="text-sm font-bold">{localStorage.getItem("userName") || "Valued Guest"}</p>
                   <p className="text-xs text-muted-foreground">{form.mobile}</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center bg-primary/5 rounded-[2rem] p-6 border-2 border-dashed border-primary/20">
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Your Allotted Table</p>
                <p className="text-5xl font-black text-primary">T-{allottedTableNo}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/5 p-5">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-3">Booking Charges</p>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex justify-between">
                  <span>Table charge</span>
                  <span>Rs. {tableCharge}</span>
                </div>
                {bookedItems.length > 0 && (
                  <div className="flex justify-between">
                    <span>Food subtotal</span>
                    <span>Rs. {bookedItems.reduce((acc, i) => acc + i.price * i.quantity, 0)}</span>
                  </div>
                )}
                {rushBookingApplies && bookedItems.length > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Rush surcharge</span>
                    <span>Rs. {surchargeAmount}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-primary">
                  <span>Total charged</span>
                  <span>Rs. {totalWithSurcharge}</span>
                </div>
              </div>
            </div>

            {bookedItems.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-dashed">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Pre-Ordered Items</p>
                                <div className="space-y-2.5">
                   {bookedItems.map((item, idx) => (
                     <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-foreground/80">{item.name} <span className="text-muted-foreground ml-1">× {item.quantity}</span></span>
                        <span className="font-bold">Rs. {item.price * item.quantity}</span>
                     </div>
                   ))}
                   <div className="flex justify-between items-center pt-3 text-sm border-t">
                      <span>Food Subtotal</span>
                      <span>Rs. {bookedItems.reduce((acc, i) => acc + i.price * i.quantity, 0)}</span>
                   </div>
                   {rushBookingApplies && bookedItems.length > 0 && (
                     <div className="flex justify-between items-center text-sm text-amber-700">
                        <span>Rush Booking Surcharge</span>
                        <span>Rs. {surchargeAmount}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center font-black text-base text-primary">
                      <span>{paymentInfo.status === "Completed" ? "Total Paid" : "Amount Due"}</span>
                      <span>Rs. {bookedItems.reduce((acc, i) => acc + i.price * i.quantity, 0) + (rushBookingApplies ? surchargeAmount : 0)}</span>
                   </div>
                   <div className="flex items-center justify-between mt-2 px-3 py-1.5 bg-muted/50 rounded-lg">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Payment</span>
                      <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{paymentInfo.method}</span>
                   </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/" className="flex-[2] inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-[0.98]">
                Back Home <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/bookings" className="flex-1 inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-2xl font-bold hover:bg-secondary/80 transition-all active:scale-[0.98]">
                My Bookings
              </Link>
            </div>
          </div>
          <div className="text-center pb-4">
            <p className="text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-lg inline-block">
              💰 Table cost only should be paid while visiting the restaurant
            </p>
          </div>
          <p className="text-center pb-8 text-[10px] text-muted-foreground">Please show this screen at the reception upon arrival.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20 py-20">
        <div className="container mx-auto px-4 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <CalendarDays className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground">Reserve Your Table</h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-lg">Secure your spot at Mezbaan and enjoy an unforgettable dining experience</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Details */}
            <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-lg space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-border/20">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Reservation Details</h3>
              </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Date
                    </label>
                    <input 
                      type="date" 
                      required 
                      min={today}
                      max={maxBookingDate}
                      value={form.date} 
                      onChange={e => setForm(p => ({ ...p, date: e.target.value, time: "" }))}
                      className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Time
                    </label>
                    <select 
                      required 
                      value={form.time} 
                      onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    >
                      <option value="">Select time</option>
                      {availableTimeSlots.map(slot => (
                        <option key={slot.value} value={slot.value}>{slot.label}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">Reservations must be at least 6 hours in advance</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      Number of Guests
                    </label>
                    <select value={form.guests} onChange={e => { setForm(p => ({ ...p, guests: e.target.value })); }}
                      className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                      {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} {n === 1 ? "Guest" : "Guests"}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit number"
                      value={form.mobile}
                      onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
                {availableTables.length === 0 ? (
                  <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-destructive/10 rounded-full flex items-center justify-center mt-0.5">
                        <div className="w-2 h-2 bg-destructive rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-medium">No tables available</p>
                        <p className="text-xs mt-1">Sorry, no tables are available for {guestCount} guests at this time. Please try a different date, time, or guest count.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center mt-0.5">
                          <CheckCircle className="h-3 w-3 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-primary">Table Available</p>
                          <p className="text-sm text-primary/80 mt-1">Recommended: Table T-{selectedTable?.number} (fits up to {selectedTable?.capacity} guests)</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 rounded-2xl p-6 space-y-3">
                      <h4 className="font-semibold text-sm text-foreground">Cost Breakdown</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Table charge ({guestCount} × ₹{TABLE_RATE_PER_GUEST})</span>
                          <span>₹{tableCharge}</span>
                        </div>
                        {subtotal > 0 && (
                          <div className="flex justify-between">
                            <span>Food subtotal</span>
                            <span>₹{subtotal}</span>
                          </div>
                        )}
                        {rushBookingApplies && (
                          <div className="flex justify-between text-amber-700">
                            <span>Rush surcharge (20%)</span>
                            <span>₹{surchargeAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-primary border-t pt-2">
                          <span>Estimated Total</span>
                          <span>₹{totalWithSurcharge}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {rushBookingApplies && (
                  <div className="rounded-2xl border border-amber-300/50 bg-amber-50/50 px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                        <Clock className="h-3 w-3 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-900">Rush Booking</p>
                        <p className="text-sm text-amber-800 mt-1">Booking for {bookingLeadDays === 0 ? "today" : "tomorrow"} includes a 20% surcharge on pre-ordered items.</p>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={availableTables.length === 0 || !form.date || !form.time || !form.mobile || loading}
                  className="w-full bg-primary text-primary-foreground py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-primary/20"
                >
                  {loading ? "Processing..." : "Confirm Reservation"}
                </button>
                {error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}
            </div>

            {/* Menu Selection */}
            <div className="space-y-4">
              <div className="bg-card border border-border/50 rounded-3xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold">Your Order</h3>
                  <Link 
                    to="/menu" 
                    className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    Add items <Plus className="h-3 w-3" />
                  </Link>
                </div>
                
                {cartItems.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {cartItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-muted/30 border rounded-xl p-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">₹{item.price} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-xs"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-xs"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive/80 p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">No items selected</p>
                    <Link to="/menu" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90">
                      Browse Menu
                    </Link>
                  </div>
                )}
                
                {cartItems.length > 0 && (
                  <div className="pt-4 border-t border-dashed space-y-2">
                    <div className="flex justify-between items-center font-medium">
                      <span>Food Subtotal:</span>
                      <span>Rs. {subtotal}</span>
                    </div>
                    {rushBookingApplies && (
                      <div className="flex justify-between items-center text-sm text-amber-700">
                        <span>Rush Surcharge (20%):</span>
                        <span>Rs. {surchargeAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center font-bold">
                      <span>Total:</span>
                      <span className="text-primary text-lg">Rs. {totalWithSurcharge}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
