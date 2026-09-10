import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Settings, Bell, Lock, Download, Trash2
} from "lucide-react";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { SecurityForm } from "@/components/settings/SecurityForm";
import { DataForm } from "@/components/settings/DataForm";
import { DangerZone } from "@/components/settings/DangerZone";

export default function SettingsPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
        <div className="container px-4 py-8 mx-auto">
          <div className="space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <div className="container px-4 py-8 mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
          <Tabs defaultValue="account" className="w-full" orientation="vertical">
            <div className="hidden md:block">
              <TabsList className="flex flex-col h-auto p-0 bg-transparent items-stretch">
                <TabsTrigger
                  value="account"
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <User className="w-4 h-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="privacy"
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Privacy
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="justify-start w-full p-2 data-[state=active]:bg-muted"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Data
                </TabsTrigger>
                <TabsTrigger
                  value="danger"
                  className="justify-start w-full p-2 data-[state=active]:bg-muted text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Danger Zone
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="block md:hidden mb-6">
              <TabsList className="w-full grid grid-cols-3 h-auto">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="privacy">Privacy</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              <TabsList className="w-full grid grid-cols-2 h-auto mt-2">
                <TabsTrigger value="data">Data</TabsTrigger>
                <TabsTrigger value="danger">Danger</TabsTrigger>
              </TabsList>
            </div>

            <div className="rounded-lg border shadow-sm bg-card">
              <TabsContent value="account" className="p-6 space-y-6 animate-in fade-in-50">
                <ProfileForm />
              </TabsContent>

              <TabsContent value="privacy" className="p-6 space-y-6 animate-in fade-in-50">
                <SettingsForm />
              </TabsContent>

              <TabsContent value="security" className="p-6 space-y-6 animate-in fade-in-50">
                <SecurityForm />
              </TabsContent>

              <TabsContent value="data" className="p-6 space-y-6 animate-in fade-in-50">
                <DataForm />
              </TabsContent>

              <TabsContent value="danger" className="p-6 space-y-6 animate-in fade-in-50">
                <DangerZone />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
