import { createContext, useContext, useEffect, useState } from "react";
import { API_ENDPOINTS } from "../config/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch user & subscription on load
  useEffect(() => {
    const fetchUserAndSubscription = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Optimized: Fetch both user and subscription in parallel
        const [userRes, subRes] = await Promise.all([
          fetch(API_ENDPOINTS.ME, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(API_ENDPOINTS.USER_SUBSCRIPTION, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!userRes.ok) throw new Error("Failed to fetch user");

        const userData = await userRes.json();
        setUser(userData);

        let subscription = null;
        if (subRes.ok) {
          const subData = await subRes.json();
          subscription = subData.subscription;
          setSubscription(subscription);
        }

        const isActive = subscription?.status === "active";
        localStorage.setItem("hasPaid", isActive ? "true" : "false");
      } catch (err) {
        console.error("❌ AuthProvider Error:", err.message);
        localStorage.removeItem("token");
        localStorage.removeItem("hasPaid");
        setUser(null);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndSubscription();
  }, []);

  // 📝 Register
  const register = async (name, email, password) => {
    try {
      const res = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Registration error:", data);
        return { success: false, error: data };
      }

      localStorage.setItem("token", data.token);
      setUser(data.user);

      const isActive = data.user?.subscription === "active";
      localStorage.setItem("hasPaid", isActive ? "true" : "false");

      return { success: true, user: data.user, token: data.token };
    } catch (err) {
      console.error("🔥 Registration failed:", err.message);
      return { success: false, error: { message: "Server error" } };
    }
  };

  // 🔐 Login
  const login = async (email, password) => {
    try {
      const res = await fetch(API_ENDPOINTS.LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok && res.status !== 403) {
        console.warn("Login failed:", data);
        localStorage.removeItem("token");
        localStorage.removeItem("hasPaid");
        return {
          success: false,
          status: res.status,
          message: data?.message || data?.error || "Login failed",
        };
      }

      // Handle both 200 (active) and 403 (inactive) as success
      const isActive = res.status === 200;
      
      // Save token & user
      localStorage.setItem("token", data.token);
      setUser(data.user);

      // Optimized: Fetch subscription in parallel with setting state, don't block response
      const finalIsActive = data.user?.subscription === 'active' || isActive;
      localStorage.setItem("hasPaid", finalIsActive ? "true" : "false");

      // Fetch subscription asynchronously without blocking
      fetch(API_ENDPOINTS.USER_SUBSCRIPTION, {
        headers: { Authorization: `Bearer ${data.token}` },
      })
        .then(subRes => {
          if (subRes.ok) {
            return subRes.json();
          }
          return null;
        })
        .then(subData => {
          if (subData?.subscription) {
            setSubscription(subData.subscription);
            const updatedIsActive = subData.subscription?.status === "active";
            localStorage.setItem("hasPaid", updatedIsActive ? "true" : "false");
          }
        })
        .catch(err => {
          console.warn("Subscription fetch error (non-blocking):", err);
          setSubscription(null);
        });

      return {
        success: true,
        token: data.token,
        user: {
          ...data.user,
          isActive: finalIsActive,
        },
      };
    } catch (err) {
      console.error("🔥 Login error:", err.message);
      return {
        success: false,
        status: 500,
        message: "Server error",
      };
    }
  };

  // 🚪 Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("hasPaid");
    setUser(null);
    setSubscription(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        loading,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
