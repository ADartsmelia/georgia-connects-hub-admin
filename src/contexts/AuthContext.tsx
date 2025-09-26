import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { adminApiClient, User } from "@/lib/api";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("admin_auth_token");
        console.log("AdminAuthContext initAuth - token found:", !!token);

        if (token) {
          // Set the token in the API client
          adminApiClient.setAuthToken(token);
          console.log("AdminAuthContext - fetching current user...");

          try {
            const currentUser = await adminApiClient.getCurrentUser();
            console.log("AdminAuthContext - current user:", currentUser);

            // Check if user is admin
            if (!currentUser.isAdmin && !currentUser.isSuperAdmin) {
              console.log(
                "AdminAuthContext - user is not admin, clearing auth"
              );
              setUser(null);
              adminApiClient.clearAuth();
              toast.error("Admin access required");
            } else {
              setUser(currentUser);
            }
          } catch (error) {
            console.log(
              "AdminAuthContext - failed to get current user, clearing auth"
            );
            setUser(null);
            adminApiClient.clearAuth();
          }
        } else {
          // No token, clear any existing auth
          console.log("AdminAuthContext - no token, clearing auth");
          setUser(null);
        }
      } catch (error) {
        console.error("Admin auth initialization error:", error);
        // Clear auth on error
        setUser(null);
        adminApiClient.clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("AdminAuthContext: Starting login...");
      setIsLoading(true);
      const response = await adminApiClient.login({ email, password });
      console.log("AdminAuthContext: Login API response:", response);

      // Check if user is admin
      if (
        response.data.data?.user &&
        (response.data.data.user.isAdmin ||
          response.data.data.user.isSuperAdmin)
      ) {
        setUser(response.data.data.user);
        toast.success("Admin login successful");
        console.log("AdminAuthContext: Admin login completed successfully");
      } else {
        adminApiClient.clearAuth();
        toast.error("Admin access required");
        throw new Error("Admin access required");
      }
    } catch (error: any) {
      console.error("AdminAuthContext: Login error:", error);
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminApiClient.logout();
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      // Clear local state even if API call fails
      setUser(null);
      adminApiClient.clearAuth();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
