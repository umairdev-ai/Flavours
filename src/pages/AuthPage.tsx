import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

type AuthTab = "login" | "register";
type LoginRole = "user" | "admin";

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>("login");
  const [loginRole, setLoginRole] = useState<LoginRole>("user");
  const [loginForm, setLoginForm] = useState({ email: "", username: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

    try {
      const res = await fetch(buildApiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      localStorage.setItem("userToken", data.token);
      localStorage.setItem("userName", data.user?.name || "");
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
    window.dispatchEvent(new Event("authChanged"));
    navigate("/");
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
            ) : (
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
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={e => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                  />
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
                {error && <p className="text-sm text-destructive">{error}</p>}
                {success && <p className="text-sm text-success">{success}</p>}
                <button type="submit" className="w-full bg-primary text-primary-foreground px-4 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-all">
                  Register
                </button>
              </form>
            )}

            <p className="text-sm text-muted-foreground">
              {activeTab === "login" ? "New here?" : "Already registered?"} <button type="button" onClick={() => setActiveTab(activeTab === "login" ? "register" : "login")} className="text-primary underline">{activeTab === "login" ? "Create an account" : "Sign in"}</button>
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
