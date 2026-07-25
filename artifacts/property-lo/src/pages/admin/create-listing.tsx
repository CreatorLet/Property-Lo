import { useState } from 'react';
import { useCreateListing } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAdminListingsQueryKey } from '@workspace/api-client-react';
import { Plus, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { compressImage } from '@/lib/compress-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const MAX_IMAGE_SIZE = 20 * 1024 * 1024; // 20MB — compressed before upload

const createSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['house', 'apartment', 'land', 'commercial']),
  purpose: z.enum(['rent', 'sale', 'shortlet']),
  price: z.coerce.number().min(1, 'Price must be greater than 0'),
  location: z.string().min(2, 'Location is required'),
  state: z.string().min(2, 'State is required'),
  bedrooms: z.coerce.number().optional(),
  bathrooms: z.coerce.number().optional(),
  size: z.string().optional(),
});

type CreateSchema = z.infer<typeof createSchema>;

export function CreateListingButton() {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const createListing = useCreateListing();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateSchema>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'house',
      purpose: 'sale',
      price: 0,
      location: '',
      state: '',
      bedrooms: undefined,
      bathrooms: undefined,
      size: '',
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const oversized = Array.from(files).find((f) => f.size > MAX_IMAGE_SIZE);
    if (oversized) {
      toast({ title: 'Image too large', description: `${oversized.name} exceeds 20MB`, variant: 'destructive' });
      return;
    }

    setCompressing(true);
    try {
      const compressed = await Promise.all(
        Array.from(files).map((f) => compressImage(f, 1920, 1080, 0.78))
      );
      setImages((prev) => [...prev, ...compressed]);
    } catch {
      toast({ title: 'Failed to process images', variant: 'destructive' });
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSubmit = (data: CreateSchema) => {
    if (images.length === 0) {
      toast({ title: 'At least one image is required', variant: 'destructive' });
      return;
    }

    createListing.mutate(
      {
        data: {
          title: data.title,
          description: data.description,
          type: data.type,
          purpose: data.purpose,
          price: data.price,
          location: data.location,
          state: data.state,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          size: data.size || undefined,
          images_base64: images,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Listing created successfully' });
          setOpen(false);
          form.reset();
          setImages([]);
          queryClient.invalidateQueries({ queryKey: getGetAdminListingsQueryKey() });
        },
        onError: (error) => {
          toast({ title: 'Failed to create listing', description: error.message, variant: 'destructive' });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Add Listing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Listing</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 pt-2">
            {/* Images */}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Property Images *</label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-border bg-muted aspect-video">
                      <img src={img} alt={`img-${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className={`rounded-lg border-2 border-dashed border-border bg-muted/20 p-4 flex items-center justify-center relative transition-colors ${compressing ? 'opacity-60 cursor-wait' : 'hover:bg-muted/40 cursor-pointer'}`}>
                {!compressing && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleImageUpload}
                  />
                )}
                <div className="text-center text-muted-foreground">
                  {compressing ? (
                    <>
                      <Loader2 className="h-6 w-6 mx-auto mb-1 animate-spin" />
                      <p className="text-sm">Compressing images…</p>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50" />
                      <p className="text-sm">Click to upload images (max 20MB each)</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="4-Bedroom Detached Duplex in Lekki Phase 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Describe the property..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type & Purpose */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sale">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
                        <SelectItem value="shortlet">Shortlet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₦) *</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} placeholder="75000000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Location & State */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lekki Phase 1, Lagos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State *</FormLabel>
                    <FormControl>
                      <Input placeholder="Lagos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bedrooms, Bathrooms, Size */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="size"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Size</FormLabel>
                    <FormControl>
                      <Input placeholder="500 sqm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createListing.isPending}>
                {createListing.isPending ? 'Creating...' : 'Create Listing'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
