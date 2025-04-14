
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Trash2, Plus, Pencil } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string;
  ad_size: "small" | "medium" | "large";
  ad_position: "top" | "side" | "inline";
  is_active: boolean;
  created_at: string;
}

const adSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  content: z.string().min(5, { message: "Content must be at least 5 characters" }),
  image_url: z.string().url({ message: "Must be a valid URL" }).nullable().optional(),
  link_url: z.string().url({ message: "Must be a valid URL" }),
  ad_size: z.enum(["small", "medium", "large"], { 
    required_error: "Please select an ad size" 
  }),
  ad_position: z.enum(["top", "side", "inline"], { 
    required_error: "Please select an ad position" 
  }),
  is_active: z.boolean().default(true),
});

const AdManagerPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);

  // Fetch ads
  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Ad[];
    },
  });

  // Create ad mutation
  const createAdMutation = useMutation({
    mutationFn: async (newAd: z.infer<typeof adSchema>) => {
      const { data, error } = await supabase
        .from("ads")
        .insert([newAd])
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      toast.success("Ad created successfully");
      setIsNewDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating ad: ${error.message}`);
    },
  });

  // Update ad mutation
  const updateAdMutation = useMutation({
    mutationFn: async ({ id, ad }: { id: string; ad: z.infer<typeof adSchema> }) => {
      const { data, error } = await supabase
        .from("ads")
        .update(ad)
        .eq("id", id)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      toast.success("Ad updated successfully");
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error updating ad: ${error.message}`);
    },
  });

  // Delete ad mutation
  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ads"] });
      toast.success("Ad deleted successfully");
    },
    onError: (error) => {
      toast.error(`Error deleting ad: ${error.message}`);
    },
  });

  // Form for new ads
  const newForm = useForm<z.infer<typeof adSchema>>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      content: "",
      image_url: "",
      link_url: "",
      ad_size: "medium",
      ad_position: "inline",
      is_active: true,
    },
  });

  // Form for editing ads
  const editForm = useForm<z.infer<typeof adSchema>>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      content: "",
      image_url: "",
      link_url: "",
      ad_size: "medium",
      ad_position: "inline",
      is_active: true,
    },
  });

  // Set edit form values when currentAd changes
  useEffect(() => {
    if (currentAd) {
      editForm.reset({
        title: currentAd.title,
        content: currentAd.content,
        image_url: currentAd.image_url || "",
        link_url: currentAd.link_url,
        ad_size: currentAd.ad_size,
        ad_position: currentAd.ad_position,
        is_active: currentAd.is_active,
      });
    }
  }, [currentAd, editForm]);

  const handleCreateSubmit = (values: z.infer<typeof adSchema>) => {
    createAdMutation.mutate(values);
  };

  const handleEditSubmit = (values: z.infer<typeof adSchema>) => {
    if (currentAd) {
      updateAdMutation.mutate({ id: currentAd.id, ad: values });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this ad?")) {
      deleteAdMutation.mutate(id);
    }
  };

  const handleEditClick = (ad: Ad) => {
    setCurrentAd(ad);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="container py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ad Manager</h1>
          <p className="text-muted-foreground">
            Create and manage advertisements for the platform
          </p>
        </div>

        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Create New Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Advertisement</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new ad for the platform
              </DialogDescription>
            </DialogHeader>

            <Form {...newForm}>
              <form
                onSubmit={newForm.handleSubmit(handleCreateSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={newForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ad title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter ad content" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newForm.control}
                    name="ad_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newForm.control}
                    name="ad_position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="side">Side</SelectItem>
                            <SelectItem value="inline">Inline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newForm.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newForm.control}
                  name="link_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Activate or deactivate this advertisement
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Create Ad</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Advertisement</DialogTitle>
              <DialogDescription>
                Update the details for this advertisement
              </DialogDescription>
            </DialogHeader>

            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleEditSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ad title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter ad content" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="ad_size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Size</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="ad_position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="side">Side</SelectItem>
                            <SelectItem value="inline">Inline</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="link_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Activate or deactivate this advertisement
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Ad</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Advertisements</CardTitle>
          <CardDescription>
            Manage all ads displayed across the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : !ads || ads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-xl font-semibold">No advertisements found</p>
              <p className="text-muted-foreground">
                Create your first ad to start monetizing the platform
              </p>
              <Button
                className="mt-4 bg-purple-600 hover:bg-purple-700"
                onClick={() => setIsNewDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Ad
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ads.map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ad.title}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {ad.content.length > 30
                            ? `${ad.content.substring(0, 30)}...`
                            : ad.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{ad.ad_size}</TableCell>
                    <TableCell className="capitalize">{ad.ad_position}</TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                          ad.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {ad.is_active ? "Active" : "Inactive"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(ad.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditClick(ad)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdManagerPage;
