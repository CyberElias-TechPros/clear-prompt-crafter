import React, { useEffect, useState } from "react";
import { Check, Download, Eye, Lock, Palette, Shield, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { apiGet, apiPatch, isApiConfigured, type MeResponse } from "@/lib/api";
import { getLocalSettings, saveLocalSettings, type LocalSettings } from "@/lib/demo-data";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Seo from "@/components/Seo";

export default function SettingsPage() {
  const { isDemo, refreshSession } = useAuth();
  const [settings, setSettings] = useState<LocalSettings>(() => getLocalSettings());
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(isApiConfigured && !isDemo);
  const update = <K extends keyof LocalSettings>(key: K, value: LocalSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!isApiConfigured || isDemo) { setBusy(false); return; }
    let active = true;
    void apiGet<MeResponse>("/me").then((response) => {
      if (!active) return;
      setSettings((current) => ({
        ...current,
        displayName: response.user.fullName,
        emailDigest: response.settings.emailDigest,
        showPublicProfile: response.settings.showPublicProfile,
        reducedMotion: response.settings.reducedMotion,
      }));
    }).catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Unable to load settings."); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [isDemo]);

  const save = async () => {
    setBusy(true);
    try {
      if (isApiConfigured && !isDemo) {
        await Promise.all([
          apiPatch("/me", { fullName: settings.displayName }),
          apiPatch("/me/settings", {
            emailDigest: settings.emailDigest,
            showPublicProfile: settings.showPublicProfile,
            reducedMotion: settings.reducedMotion,
          }),
        ]);
        await refreshSession();
        toast.success("Account settings saved");
      } else {
        saveLocalSettings(settings);
        toast.success("Demo settings saved to this browser");
      }
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings.");
    } finally { setBusy(false); }
  };

  const exportData = async () => {
    try {
      const data = isApiConfigured && !isDemo ? await apiGet<unknown>("/me/export") : { settings, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "prompt-gineer-data.json";
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Export ready");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to export data."); }
  };

  const clearLocalWorkspace = () => {
    window.localStorage.removeItem("promptgineer-prompts-v2");
    window.localStorage.removeItem("promptgineer-services-v1");
    window.localStorage.removeItem("promptgineer-settings-v1");
    toast.success("Local demo cache cleared");
  };

  return (
    <div className="page-enter mx-auto max-w-4xl"><Seo title="Settings — Prompt-Gineer" description="Manage your Prompt-Gineer workspace preferences." path="/settings" noindex /><div className="mb-8"><p className="eyebrow">Workspace preferences</p><h1 className="display-font mt-2 text-4xl font-semibold leading-none">Settings that stay out of the way.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{isApiConfigured && !isDemo ? "These preferences are stored on your Prompt-Gineer account." : "These demo preferences are stored locally in this browser."}</p></div><div className="space-y-5"><section className="surface rounded-2xl p-5 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><UserRound className="h-4 w-4" /></div><div><h2 className="text-lg font-bold">Profile</h2><p className="mt-1 text-xs text-muted-foreground">The name shown across your workspace.</p></div></div><div className="mt-6 max-w-md"><Label htmlFor="display-name">Display name</Label><Input id="display-name" value={settings.displayName} onChange={(event) => update("displayName", event.target.value)} className="mt-2 h-11 rounded-xl" /></div></section><section className="surface rounded-2xl p-5 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6d62b1]/10 text-[#6d62b1]"><Palette className="h-4 w-4" /></div><div><h2 className="text-lg font-bold">Experience</h2><p className="mt-1 text-xs text-muted-foreground">Control how the studio communicates with you.</p></div></div><div className="mt-6 divide-y"><div className="flex items-center justify-between gap-5 py-4 first:pt-0"><div><p className="text-sm font-semibold">Weekly prompt digest</p><p className="mt-1 text-xs leading-5 text-muted-foreground">A quiet email with ideas from the community. No spam.</p></div><Switch checked={settings.emailDigest} onCheckedChange={(value) => update("emailDigest", value)} /></div><div className="flex items-center justify-between gap-5 py-4"><div><p className="text-sm font-semibold">Show public profile</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Let community members see your name on prompts you publish.</p></div><Switch checked={settings.showPublicProfile} onCheckedChange={(value) => update("showPublicProfile", value)} /></div><div className="flex items-center justify-between gap-5 py-4 last:pb-0"><div><p className="text-sm font-semibold">Reduce motion</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Prefer shorter transitions and no decorative movement.</p></div><Switch checked={settings.reducedMotion} onCheckedChange={(value) => update("reducedMotion", value)} /></div></div></section><section className="surface rounded-2xl p-5 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b77b22]/10 text-[#b77b22]"><Shield className="h-4 w-4" /></div><div><h2 className="text-lg font-bold">Privacy & data</h2><p className="mt-1 text-xs text-muted-foreground">Keep the boundary between your thinking and your tools clear.</p></div></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border bg-secondary/40 p-4"><Lock className="h-4 w-4 text-accent" /><p className="mt-3 text-sm font-semibold">Private by default</p><p className="mt-1 text-xs leading-5 text-muted-foreground">New prompt systems are private until you choose to publish them.</p></div><div className="rounded-xl border bg-secondary/40 p-4"><Eye className="h-4 w-4 text-accent" /><p className="mt-3 text-sm font-semibold">No hidden training</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Provider execution is explicit and server-side when enabled.</p></div></div><Button onClick={() => void exportData()} variant="outline" size="sm" className="mt-5"><Download className="h-4 w-4" /> Export my data</Button></section><section className="rounded-2xl border border-destructive/20 bg-destructive/[.03] p-5 sm:p-7"><div className="flex items-start gap-4"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></div><div className="flex-1"><h2 className="text-lg font-bold">Local cache</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Clear demo-only browser data. This never deletes account data from the API.</p><Button onClick={clearLocalWorkspace} variant="outline" size="sm" className="mt-5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive">Clear local cache</Button></div></div></section><div className="flex items-center justify-end gap-3 border-t pt-5"><span className="mr-auto text-xs text-muted-foreground">{saved ? <span className="flex items-center gap-1.5 text-accent"><Check className="h-3.5 w-3.5" /> Saved just now</span> : "Changes are only applied when you save."}</span><Button onClick={() => void save()} disabled={busy} className="bg-accent text-accent-foreground hover:bg-accent/90"><Check className="h-4 w-4" /> {busy ? "Saving..." : "Save changes"}</Button></div></div></div>
  );
}
