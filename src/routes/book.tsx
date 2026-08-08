import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
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
import { format } from "date-fns";

const bookingSchema = z.object({
  date: z.string().min(1, "Please select a date"),
  time: z.string().min(1, "Please select a time slot"),
});

export const Route = createFileRoute("/book")({
  component: BookingComponent,
});

function BookingComponent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate);
    }
  }, [selectedDate]);

  async function fetchSlots(date: string) {
    try {
      const res = await fetch(`/api/appointments/slots?date=${date}`);
      if (res.ok) {
        const slots = await res.json();
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (e) {
      setAvailableSlots([]);
    }
  }

  async function onSubmit(data: z.infer<typeof bookingSchema>) {
    setIsLoading(true);
    try {
      const res = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Appointment booked successfully!" });
        navigate({ to: "/" });
      } else {
        const err = await res.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Booking failed",
        });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "A network error occurred" });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Book Your Session</CardTitle>
          <CardDescription>Select a date and time for your CPR certification</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                onChange={(e) => {
                  register("date").onChange(e);
                  setSelectedDate(e.target.value);
                }}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time Slot</Label>
              <select
                {...register("time")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select a slot</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {errors.time && (
                <p className="text-sm text-red-500">{errors.time.message as string}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Booking..." : "Confirm Appointment"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <a href="/contact" className="text-primary underline">
              Contact us
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
