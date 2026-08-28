import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck } from "lucide-react";

export function SecurityForm() {
  const { changePassword } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) {
      toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" });
      return;
    }
    if (next !== confirm) {
      toast({ title: "Passwords don't match", description: "Please re-enter your new password.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const { error } = await changePassword(current, next);
    setIsSubmitting(false);
    if (error) {
      toast({ title: "Password change failed", description: error.message, variant: "destructive" });
    } else {
      setCurrent("");
      setNext("");
      setConfirm("");
      toast({ title: "Password updated", description: "Your password has been changed successfully." });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Security
        </h2>
        <p className="text-sm text-muted-foreground">Manage your password and account security</p>
      </div>

      <Separator />

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="current">Current password</Label>
          <Input
            id="current"
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new">New password</Label>
          <Input
            id="new"
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
}
