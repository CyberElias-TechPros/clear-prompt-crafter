import React, { useState } from "react";
import { authApi } from "@/lib/backend";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, Database } from "lucide-react";

export function DataForm() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await authApi.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompt-gineer-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Data exported", description: "Your data has been downloaded as JSON." });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error?.message || "Could not export your data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <Database className="w-5 h-5" /> Data Management
        </h2>
        <p className="text-sm text-muted-foreground">Export a copy of your data</p>
      </div>

      <Separator />

      <div className="space-y-4 max-w-md">
        <p className="text-sm text-muted-foreground">
          Download a JSON file containing your profile, prompts, templates, comments, likes,
          points, badges and activity history.
        </p>
        <Button onClick={handleExport} disabled={isExporting} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export My Data"}
        </Button>
      </div>
    </div>
  );
}
