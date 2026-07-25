import { useState } from 'react';
import { useGetAdminAds, useCreateAd, useUpdateAd, useDeleteAd } from '@workspace/api-client-react';
import { compressImage } from '@/lib/compress-image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit2, Check, X, Image as ImageIcon } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAdminAdsQueryKey } from '@workspace/api-client-react';
import { Switch } from '@/components/ui/switch';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB — compressed before upload

const adSchema = z.object({
  title: z.string().optional(),
  link: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  position: z.coerce.number().min(1, "Must be greater than 0"),
  is_active: z.boolean().default(true),
});

export default function AdminAds() {
  const { data: ads, isLoading } = useGetAdminAds();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [imageBase64, setImageBase64] = useState<string>('');

  const form = useForm<z.infer<typeof adSchema>>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      link: "",
      position: 1,
      is_active: true,
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      toast({ title: "Image too large", description: "Must be under 20MB", variant: "destructive" });
      return;
    }

    try {
      // Compress to 1920×823 (21:9 banner ratio) at 80% quality
      const compressed = await compressImage(file, 1920, 823, 0.80);
      setImageBase64(compressed);
    } catch {
      toast({ title: "Failed to process image", variant: "destructive" });
    }
  };

  const onSubmit = (data: z.infer<typeof adSchema>) => {
    if (!imageBase64) {
      toast({ title: "Image required", description: "Please select an image for the ad.", variant: "destructive" });
      return;
    }

    createAd.mutate({
      data: {
        title: data.title || undefined,
        redirect_url: data.link || undefined,
        slide_order: data.position,
        is_active: data.is_active,
        image_base64: imageBase64,
      }
    }, {
      onSuccess: () => {
        toast({ title: "Ad created successfully" });
        setIsCreateOpen(false);
        form.reset();
        setImageBase64('');
        queryClient.invalidateQueries({ queryKey: getGetAdminAdsQueryKey() });
      },
      onError: (error) => {
        toast({ title: "Failed to create", description: error.message, variant: "destructive" });
      }
    });
  };

  const toggleActive = (id: string, current: boolean) => {
    updateAd.mutate({ id, data: { is_active: !current } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAdminAdsQueryKey() });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this advertisement?")) {
      deleteAd.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "Ad deleted" });
          queryClient.invalidateQueries({ queryKey: getGetAdminAdsQueryKey() });
        }
      });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Carousel Ads</h1>
          <p className="text-muted-foreground mt-1">Manage the hero advertisements shown on the homepage.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add New Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Advertisement</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Advertisement Image *</label>
                  {imageBase64 ? (
                    <div className="relative rounded-lg overflow-hidden border border-border bg-muted w-full aspect-[21/9]">
                      <img src={imageBase64} alt="Ad Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setImageBase64('')}
                        className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 w-full aspect-[21/9] flex items-center justify-center relative hover:bg-muted/50 transition-colors cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        onChange={handleImageUpload}
                      />
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm font-medium">Click to upload image</p>
                        <p className="text-xs mt-1">16:9 ratio recommended, max 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heading Text (Optional)</FormLabel>
                      <FormControl><Input placeholder="Exclusive Ikoyi Properties..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target URL (Optional)</FormLabel>
                      <FormControl><Input placeholder="https://propertylo.ng/listings?search=ikoyi" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Slide Order</FormLabel>
                        <FormControl><Input type="number" min={1} {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex-1 flex flex-col justify-center pt-6">
                        <div className="flex items-center gap-3">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <FormLabel className="!mt-0 cursor-pointer">Active</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createAd.isPending}>
                    {createAd.isPending ? 'Saving...' : 'Save Ad'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <Skeleton key={i} className="aspect-[21/9] w-full rounded-xl" />)
        ) : !ads || ads.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-card border border-border rounded-xl">
            <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium">No advertisements created yet</p>
          </div>
        ) : (
          [...ads].sort((a, b) => a.slide_order - b.slide_order).map(ad => (
            <div key={ad.id} className={`bg-card border ${ad.is_active ? 'border-primary/50 ring-1 ring-primary/20' : 'border-border opacity-70'} rounded-xl shadow-sm overflow-hidden flex flex-col`}>
              <div className="relative aspect-[21/9] bg-muted">
                <img src={ad.image_url} alt={ad.title || 'Ad'} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex gap-2">
                  <span className="bg-background/90 text-foreground text-xs font-bold px-2 py-1 rounded shadow-sm">
                    Order: {ad.slide_order}
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg line-clamp-1">{ad.title || <span className="text-muted-foreground italic">No title</span>}</h3>
                </div>
                {ad.redirect_url && (
                  <p className="text-sm text-primary truncate mb-4 hover:underline cursor-pointer">
                    {ad.redirect_url}
                  </p>
                )}
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={ad.is_active} 
                      onCheckedChange={() => toggleActive(ad.id, ad.is_active)} 
                      disabled={updateAd.isPending}
                    />
                    <span className="text-sm font-medium">{ad.is_active ? 'Live' : 'Hidden'}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(ad.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
