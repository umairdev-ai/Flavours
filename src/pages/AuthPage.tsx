import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, ShieldCheck, CheckCircle, Mail, Loader2 } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

type AuthTab = "login" | "register" | "forgot-password";
type LoginRole = "user" | "admin";

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [loginRole, setLoginRole] = useState<LoginRole>("user");
  const [loginForm, setLoginForm] = useState({ email: "", username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Email OTP verification state (Registration)
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  // Password Reset state
  const [forgotForm, setForgotForm] = useState({ email: "", otp: "", newPassword: "", confirmPassword: "" });
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [sendingForgotOtp, setSendingForgotOtp] = useState(false);
  const [verifyingForgotOtp, setVerifyingForgotOtp] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    const authChange = () => {
      setIsUserLoggedIn(Boolean(localStorage.getItem("userToken")));
      setIsAdminLoggedIn(Boolean(localStorage.getItem("adminToken")));
    };
    authChange();
    window.addEventListener("authChanged", authChange);
    return () => window.removeEventListener("authChanged", authChange);
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn) {
      navigate("/admin");
    }
  }, [isAdminLoggedIn, navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      let url = "";
      let body: Record<string, string> = { password: loginForm.password };

      if (loginRole === "admin") {
        url = "/admin/login";
        body.username = loginForm.username;
      } else {
        url = "/auth/login";
        body.email = loginForm.email;
      }

      const res = await fetch(buildApiUrl(url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (loginRole === "admin") {
        localStorage.setItem("adminToken", data.token);
        setSuccess("Admin logged in successfully.");
      } else {
        localStorage.setItem("userToken", data.token);
        localStorage.setItem("userName", data.user?.name || "");
        localStorage.setItem("userEmail", data.user?.email || "");

        // One-time alert check for admin-cancelled bookings upon login
        try {
          const bRes = await fetch(buildApiUrl("/bookings/my-bookings"), {
            headers: { Authorization: `Bearer ${data.token}` }
          });
          if (bRes.ok) {
            const userBookings = await bRes.json();
            const acknowledged = JSON.parse(localStorage.getItem("acknowledgedCancellations") || "[]");
            
            const newAdminCancellations = userBookings.filter((b: any) => 
              b.status === "cancelled" && 
              b.cancellationNote && 
              b.cancellationNote !== "Cancelled by guest" &&
              !acknowledged.includes(b._id)
            );

            if (newAdminCancellations.length > 0) {
              alert(`Notice: ${newAdminCancellations.length} of your reservations ${newAdminCancellations.length > 1 ? 'have' : 'has'} been cancelled by the restaurant. Please review 'My Bookings' for notes.`);
              const newlyAcknowledged = newAdminCancellations.map((b: any) => b._id);
              localStorage.setItem("acknowledgedCancellations", JSON.stringify([...acknowledged, ...newlyAcknowledged]));
            }
          }
        } catch (e) {
          console.error("Cancellation alert check failed:", e);
        }

        setSuccess("User logged in successfully.");
      }

      window.dispatchEvent(new Event("authChanged"));
      if (loginRole === "admin") {
        navigate("/admin");
      } else {
        navigate("/reserve");
      }
    } catch (err: any) {
      setError(err.message || "Unable to login. Please try again.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      // Destructure to exclude confirmPassword from the API request body
      const { confirmPassword, ...registrationData } = registerForm;
      const res = await fetch(buildApiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userName", data.user?.name || "");
      localStorage.setItem("userEmail", data.user?.email || "");
      window.dispatchEvent(new Event("authChanged"));
      setSuccess("Registration successful. Redirecting to reserve...");
      navigate("/reserve");
    } catch (err: any) {
      setError(err.message || "Unable to register. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    window.dispatchEvent(new Event("authChanged"));
    navigate("/");
  };

  const resetEmailVerification = () => {
    setOtpSent(false);
    setOtpValue("");
    setEmailVerified(false);
    setOtpError("");
    setOtpCooldown(0);
  };

  const resetForgotPassword = () => {
    setForgotForm({ email: "", otp: "", newPassword: "", confirmPassword: "" });
    setForgotOtpSent(false);
    setForgotOtpVerified(false);
    setForgotError("");
    setForgotSuccess("");
    setForgotCooldown(0);
  };

  const resetForgotPasswordOtpState = () => {
    setForgotForm(prev => ({ ...prev, otp: "", newPassword: "", confirmPassword: "" }));
    setForgotOtpSent(false);
    setForgotOtpVerified(false);
    setForgotError("");
    setForgotCooldown(0);
  };

  const handleSendForgotOtp = async () => {
    if (!forgotForm.email) {
      setForgotError("Please enter your email first.");
      return;
    }
    setSendingForgotOtp(true);
    setForgotError("");
    try {
      const res = await fetch(buildApiUrl("/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotForm.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setForgotOtpSent(true);
      setForgotCooldown(30);
      setForgotSuccess("OTP sent to your email. Check your inbox.");
      const timer = setInterval(() => {
        setForgotCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setForgotError(err.message || "Failed to send OTP");
    }
    setSendingForgotOtp(false);
  };

  const handleVerifyForgotOtp = async () => {
    if (!forgotForm.otp) { setForgotError("Please enter the OTP."); return; }
    setVerifyingForgotOtp(true);
    setForgotError("");
    try {
      const res = await fetch(buildApiUrl("/auth/verify-forgot-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotForm.email, otp: forgotForm.otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
      setForgotOtpVerified(true);
      setForgotOtpSent(false);
      setForgotSuccess("OTP verified! Now set your new password.");
    } catch (err: any) {
      setForgotError(err.message || "Verification failed");
    }
    setVerifyingForgotOtp(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }

    if (forgotForm.newPassword.length < 6) {
      setForgotError("Password must be at least 6 characters");
      return;
    }

    setResettingPassword(true);
    try {
      const res = await fetch(buildApiUrl("/auth/reset-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotForm.email, newPassword: forgotForm.newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");
      setForgotSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        resetForgotPassword();
        setActiveTab("login");
      }, 1500);
    } catch (err: any) {
      setForgotError(err.message || "Failed to reset password");
    }
    setResettingPassword(false);
  };

  const handleSendOtp = async () => {
    if (!registerForm.email) {
      setOtpError("Please enter your email first.");
      return;
    }
    setSendingOtp(true);
    setOtpError("");
    try {
      const res = await fetch(buildApiUrl("/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerForm.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setOtpSent(true);
      setOtpCooldown(30);
      const timer = setInterval(() => {
        setOtpCooldown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setOtpError(err.message || "Failed to send OTP");
    }
    setSendingOtp(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpValue) { setOtpError("Please enter the OTP."); return; }
    setVerifyingOtp(true);
    setOtpError("");
    try {
      const res = await fetch(buildApiUrl("/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registerForm.email, otp: otpValue }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed");
      setEmailVerified(true);
      setOtpSent(false);
    } catch (err: any) {
      setOtpError(err.message || "Verification failed");
    }
    setVerifyingOtp(false);
  };

  if (isUserLoggedIn && !isAdminLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-card border rounded-2xl p-8 w-full max-w-md text-center">
          <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold">You are logged in</h1>
          <p className="text-muted-foreground mt-2">Continue to reserve a table or explore our menu.</p>
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/reserve" className="inline-flex justify-center bg-primary text-primary-foreground px-4 py-3 rounded-lg font-semibold hover:bg-primary/90">Reserve Now</Link>
            <Link to="/bookings" className="inline-flex justify-center bg-secondary text-secondary-foreground px-4 py-3 rounded-lg font-semibold hover:bg-secondary/90">My Bookings</Link>
            <button onClick={handleLogout} className="inline-flex justify-center bg-muted text-muted-foreground px-4 py-3 rounded-lg font-semibold hover:bg-muted/80">Logout</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 px-4">
      <div className="bg-card border rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2 p-10 space-y-6">
            <div className="flex items-center gap-3">
              <LogIn className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Welcome to Mezbaan</h1>
                <p className="text-sm text-muted-foreground">Login or register to book your table.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setActiveTab("login")}
                className={`px-4 py-2 rounded-full font-semibold transition ${activeTab === "login" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                Login
              </button>
              <button onClick={() => setActiveTab("register")}
                className={`px-4 py-2 rounded-full font-semibold transition ${activeTab === "register" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                Register
              </button>
              <button onClick={() => { setActiveTab("forgot-password"); resetForgotPassword(); }}
                className={`px-4 py-2 rounded-full font-semibold transition ${activeTab === "forgot-password" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                Forgot Password
              </button>
            </div>

            {activeTab === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="radio" checked={loginRole === "user"} onChange={() => setLoginRole("user")} />
                    User
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input type="radio" checked={loginRole === "admin"} onChange={() => setLoginRole("admin")} />
                    Admin
                  </label>
                </div>
                {loginRole === "admin" ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Username</label>
                      <input
                        type="text"
                        required
                        value={loginForm.username}
                        onChange={e => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password</label>
                      <input
                        type="password"
                        required
                        value={loginForm.password}
                        onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <input
                        type="email"
                        required
                        value={loginForm.email}
                        onChange={e => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password</label>
                      <input
                        type="password"
                        required
                        value={loginForm.password}
                        onChange={e => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                      />
                    </div>
                  </div>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-success">{success}</p>}
                <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-all">
                  {loginRole === "admin" ? "Admin Login" : "User Login"}
                </button>
              </form>
            ) : activeTab === "register" ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={e => setRegisterForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                  />
                </div>

                {/* Email field with OTP verification */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    Email
                    {emailVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      readOnly={emailVerified}
                      value={registerForm.email}
                      onChange={e => {
                        setRegisterForm(prev => ({ ...prev, email: e.target.value }));
                        resetEmailVerification();
                      }}
                      className={`flex-1 px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 ${emailVerified ? "opacity-60 cursor-not-allowed" : ""}`}
                      placeholder="you@example.com"
                    />
                    {!emailVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || otpCooldown > 0 || !registerForm.email}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
                      </button>
                    )}
                  </div>

                  {/* OTP input — shown after OTP is sent */}
                  {otpSent && !emailVerified && (
                    <div className="flex gap-2 animate-in slide-in-from-top-1">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={otpValue}
                        onChange={e => setOtpValue(e.target.value.replace(/\D/g, ""))}
                        className="flex-1 px-4 py-3 rounded-2xl border bg-background text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp || otpValue.length !== 6}
                        className="flex-shrink-0 px-4 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {verifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Verify
                      </button>
                    </div>
                  )}

                  {emailVerified && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Email verified successfully
                    </p>
                  )}
                  {otpSent && !emailVerified && (
                    <p className="text-xs text-muted-foreground">OTP sent to {registerForm.email}. Check your inbox.</p>
                  )}
                  {otpError && <p className="text-xs text-destructive">{otpError}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={e => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={registerForm.confirmPassword}
                    onChange={e => setRegisterForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                    placeholder="Re-enter password"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-success">{success}</p>}
                <button
                  type="submit"
                  disabled={!emailVerified}
                  className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Register
                </button>
                {!emailVerified && (
                  <p className="text-xs text-muted-foreground text-center">Verify your email to enable registration</p>
                )}
              </form>
            ) : activeTab === "forgot-password" ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    required
                    readOnly={forgotOtpVerified}
                    value={forgotForm.email}
                    onChange={e => {
                      setForgotForm(prev => ({ ...prev, email: e.target.value }));
                      if (forgotOtpSent || forgotOtpVerified) {
                        resetForgotPasswordOtpState();
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1 ${forgotOtpVerified ? "opacity-60 cursor-not-allowed" : ""}`}
                    placeholder="your@email.com"
                  />
                </div>

                {/* OTP Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    Verification
                    {forgotOtpVerified && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </label>
                  {!forgotOtpSent && !forgotOtpVerified && (
                    <button
                      type="button"
                      onClick={handleSendForgotOtp}
                      disabled={sendingForgotOtp || forgotCooldown > 0 || !forgotForm.email}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingForgotOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : "Send OTP"}
                    </button>
                  )}

                  {forgotOtpSent && !forgotOtpVerified && (
                    <div className="space-y-2 animate-in slide-in-from-top-1">
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                        value={forgotForm.otp}
                        onChange={e => setForgotForm(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, "") }))}
                        className="w-full px-4 py-3 rounded-2xl border bg-background text-sm tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyForgotOtp}
                        disabled={verifyingForgotOtp || forgotForm.otp.length !== 6}
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verifyingForgotOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Verify OTP
                      </button>
                      <p className="text-xs text-muted-foreground">OTP sent to {forgotForm.email}. Check your inbox.</p>
                    </div>
                  )}

                  {forgotOtpVerified && (
                    <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> Email verified
                    </p>
                  )}
                </div>

                {/* Password Reset Section - shown after OTP verification */}
                {forgotOtpVerified && (
                  <>
                    <div>
                      <label className="text-sm font-medium">New Password</label>
                      <input
                        type="password"
                        required
                        value={forgotForm.newPassword}
                        onChange={e => setForgotForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={forgotForm.confirmPassword}
                        onChange={e => setForgotForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                        placeholder="Confirm password"
                      />
                    </div>
                  </>
                )}

                {forgotError && <p className="text-sm text-destructive">{forgotError}</p>}
                {forgotSuccess && <p className="text-sm text-green-600 font-medium">{forgotSuccess}</p>}

                <button
                  type="submit"
                  disabled={!forgotOtpVerified || resettingPassword}
                  className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {resettingPassword ? "Resetting..." : "Reset Password"}
                </button>

                {!forgotOtpVerified && (
                  <p className="text-xs text-muted-foreground text-center">Verify your email to reset password</p>
                )}
              </form>
            ) : null}

            <p className="text-sm text-muted-foreground">
              {activeTab === "login" ? "New here?" : activeTab === "register" ? "Already registered?" : "Remember password?"} <button type="button" onClick={() => { if (activeTab === "forgot-password") setActiveTab("login"); else setActiveTab(activeTab === "login" ? "register" : "login"); }} className="text-primary underline">{activeTab === "login" ? "Create an account" : activeTab === "register" ? "Sign in" : "Sign in"}</button>
            </p>
          </div>
          <div className="hidden md:flex md:w-1/2 bg-primary/5 p-10 flex-col justify-center gap-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Reserve your table in one place</h2>
              <p className="text-muted-foreground">Use the same page to register as a guest or login as a returning user. Admins can also login here.</p>
            </div>
            <div className="rounded-3xl border border-primary/20 bg-white/70 p-6">
              <h3 className="text-lg font-semibold">How it works</h3>
              <ul className="space-y-3 text-sm text-muted-foreground mt-4">
                <li>• Register with your email to reserve a table.</li>
                <li>• Login again to manage your reservations.</li>
                <li>• Admin login is separate and unlocks dashboard access.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
