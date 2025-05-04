
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Mail, User, Lock } from "lucide-react";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const navigate = useNavigate();

  // On mount, if user is already signed in, redirect to home
  useEffect(() => {
    let ignore = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !ignore) {
        navigate("/");
      }
    });
    return () => { ignore = true };
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // Validate inputs
    if (mode === "signup" && !name.trim()) {
      setErrorMsg("Name is required.");
      setLoading(false);
      return;
    }

    if (!email) {
      setErrorMsg("Email is required.");
      setLoading(false);
      return;
    }
    
    if (!password) {
      setErrorMsg("Password is required.");
      setLoading(false);
      return;
    }

    // Password strength check for signup
    if (mode === "signup" && password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        // Simple rate limiting
        if (attempts >= 5) {
          setErrorMsg("Too many login attempts. Please wait a moment before trying again.");
          setTimeout(() => setAttempts(0), 60000); // Reset after a minute
          setLoading(false);
          return;
        }

        // Log in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          setAttempts(prev => prev + 1);
          if (error.message.includes("Email not confirmed")) {
            setErrorMsg("Please verify your email before logging in.");
          } else {
            setErrorMsg(error.message || "Login failed. Please check your credentials.");
          }
        } else {
          setAttempts(0);
          toast.success("Login successful!");
          navigate("/");
        }
      } else {
        // Sign up -- pass name in data for the profiles table
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/auth`, // Redirect to auth page after email verification
          },
        });
        
        if (error) {
          if (error.message.includes("already registered")) {
            setErrorMsg("This email is already registered. Please log in instead.");
          } else {
            setErrorMsg(error.message || "Signup failed. Please try again.");
          }
        } else {
          // Check if email confirmation is required
          if (data.user && data.user.identities && data.user.identities.length === 0) {
            setErrorMsg("This email is already registered. Please log in instead.");
          } else {
            toast.success("Signup successful! Please check your email to verify your account.");
            setMode('login');
          }
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || "An unexpected error occurred.");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <Card className="w-full max-w-md border shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === "login" ? "Log in" : "Sign up"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "login"
              ? "Log in with your email and password"
              : "Create your account to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAuth}>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="youremail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder={mode === "login" ? "Your password" : "Create a secure password (min. 8 characters)"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMsg && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                {errorMsg}
              </div>
            )}
            <Button 
              className="w-full" 
              type="submit" 
              disabled={loading}
            >
              {loading
                ? (mode === "login" ? "Logging in..." : "Signing up...")
                : (mode === "login" ? "Log In" : "Sign Up")}
            </Button>
          </form>
          
          {mode === "login" && (
            <div className="mt-4">
              <p className="text-center text-sm text-gray-500">
                <button
                  onClick={() => {/* Implement password reset */}}
                  className="text-blue-600 font-medium hover:underline"
                  type="button"
                >
                  Forgot your password?
                </button>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-center text-sm">
            {mode === "login" ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setErrorMsg(null);
                    setPassword("");
                  }}
                  className="text-blue-600 font-medium hover:underline"
                  type="button"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setErrorMsg(null);
                    setPassword("");
                  }}
                  className="text-blue-600 font-medium hover:underline"
                  type="button"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;
