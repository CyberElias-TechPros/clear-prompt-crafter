import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { adsApi } from "@/lib/backend";
import { Ad } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Plus, Trash } from "lucide-react";

const AdManagerPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdDialogOpen, setIsAdDialogOpen] = useState(false);
  const [newAd, setNewAd] = useState<Omit<Ad, "id" | "created_at">>({
    title: "",
    content: "",
    ad_position: "top",
    ad_size: "small",
    image_url: null,
    is_active: true,
    link_url: "",
  });

  const { data: ads, refetch } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => (await adsApi.adminList()).items,
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return (
      <div className="container py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <CardTitle>Admins Only</CardTitle>
            <CardDescription>You need administrator access to manage ads.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const saveAd = async () => {
    try {
      if (!newAd.title || !newAd.content || !newAd.link_url) {
        toast({
          title: "Missing required fields",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      await adsApi.create(newAd);
      toast({ title: "Ad created", description: "The ad has been created successfully" });
      setIsAdDialogOpen(false);
      setNewAd({
        title: "",
        content: "",
        ad_position: "top",
        ad_size: "small",
        image_url: null,
        is_active: true,
        link_url: "",
      });
      refetch();
    } catch (error: any) {
      toast({ title: "Error creating ad", description: error.message, variant: "destructive" });
    }
  };

  const toggleAdStatus = async (ad: Ad) => {
    try {
      await adsApi.update(ad.id, { is_active: !ad.is_active });
      toast({
        title: `Ad ${!ad.is_active ? "activated" : "deactivated"}`,
        description: "The ad status has been updated",
      });
      refetch();
    } catch (error: any) {
      toast({ title: "Error updating ad", description: error.message, variant: "destructive" });
    }
  };

  const deleteAd = async (id: string) => {
    try {
      await adsApi.remove(id);
      toast({ title: "Ad deleted", description: "The ad has been deleted successfully" });
      refetch();
    } catch (error: any) {
      toast({ title: "Error deleting ad", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Ad Manager</h1>
        <Dialog open={isAdDialogOpen} onOpenChange={setIsAdDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus size={16} />
              Create New Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Advertisement</DialogTitle>
              <DialogDescription>Create a new advertisement to display on your platform</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="ad-title">Title</Label>
                <Input
                  id="ad-title"
                  value={newAd.title}
                  onChange={(e) => setNewAd({ ...newAd, title: e.target.value })}
                  placeholder="Enter ad title"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ad-content">Content</Label>
                <Textarea
                  id="ad-content"
                  value={newAd.content}
                  onChange={(e) => setNewAd({ ...newAd, content: e.target.value })}
                  placeholder="Enter ad content"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ad-image-url">Image URL (optional)</Label>
                <Input
                  id="ad-image-url"
                  value={newAd.image_url || ""}
                  onChange={(e) => setNewAd({ ...newAd, image_url: e.target.value || null })}
                  placeholder="Enter image URL"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="ad-link-url">Link URL</Label>
                <Input
                  id="ad-link-url"
                  value={newAd.link_url}
                  onChange={(e) => setNewAd({ ...newAd, link_url: e.target.value })}
                  placeholder="Enter link URL"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Ad Size</Label>
                  <Select
                    value={newAd.ad_size}
                    onValueChange={(value) => setNewAd({ ...newAd, ad_size: value as Ad["ad_size"] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Size</SelectLabel>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Ad Position</Label>
                  <Select
                    value={newAd.ad_position}
                    onValueChange={(value) =>
                      setNewAd({ ...newAd, ad_position: value as Ad["ad_position"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Position</SelectLabel>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="side">Side</SelectItem>
                        <SelectItem value="inline">Inline</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="ad-active"
                  checked={newAd.is_active}
                  onCheckedChange={(checked) => setNewAd({ ...newAd, is_active: checked })}
                />
                <Label htmlFor="ad-active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveAd}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advertisements</CardTitle>
          <CardDescription>Manage your platform advertisements</CardDescription>
        </CardHeader>
        <CardContent>
          {ads && ads.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.title}</TableCell>
                    <TableCell>{ad.ad_position}</TableCell>
                    <TableCell>{ad.ad_size}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          ad.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ad.is_active ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => toggleAdStatus(ad)}>
                          {ad.is_active ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => deleteAd(ad.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No ads found</h3>
              <p className="text-sm text-muted-foreground">
                Get started by creating a new advertisement.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdManagerPage;
