
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState(""); // Only for signup
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

    if (mode === "signup") {
      // Name is required
      if (!name.trim()) {
        setErrorMsg("Name is required.");
        setLoading(false);
        return;
      }
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

    try {
      if (mode === "login") {
        // Log in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          toast.success("Login successful!");
          navigate("/");
        }
      } else {
        // Sign up -- pass name in data for the profiles table
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });
        if (error) {
          setErrorMsg(error.message);
        } else {
          toast.success("Signup successful! Please check your email to confirm your account.");
          setMode('login');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Unknown error");
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
              ? "Log in with your email and password to save datasets & progress."
              : "Create your account to save datasets & progress."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleAuth}>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
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
              <Label htmlFor="email">Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {errorMsg && <div className="text-red-600 text-sm">{errorMsg}</div>}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading
                ? (mode === "login" ? "Logging in..." : "Signing up...")
                : (mode === "login" ? "Log In" : "Sign Up")}
            </Button>
          </form>
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
