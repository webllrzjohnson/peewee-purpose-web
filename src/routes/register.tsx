import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "@tanstack/react-router";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const Route = createFileRoute("/register")({
  component: RegisterComponent,
});

function RegisterComponent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({
          title: "Success",
          description: "Account created! Please log in.",
        });
        navigate({ to: "/login" });
      } else {
        const err = await res.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Registration failed",
        });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "A network error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create an Account</CardTitle>
          <CardDescription>Join us to start your CPR certification journey</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} placeholder="John Doe" />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" {...register("email")} placeholder="name@example.com" />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message as string}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary underline">
              Log in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
