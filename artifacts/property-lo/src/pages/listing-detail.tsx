import { useState, useRef } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { useGetListing, useCreateChat, useAddFavorite, useRemoveFavorite, useGetFavorites } from '@workspace/api-client-react';
import { getGetFavoritesQueryKey } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, Bed, Bath, Maximize, ArrowLeft, Heart, 
  MessageSquare, Share2, Mail, Phone, Calendar, Info 
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ListingDetail() {
  const [, params] = useRoute('/listings/:id');
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params?.id || '';

  const { data: listing, isLoading } = useGetListing(id, { query: { enabled: !!id } });
  const { data: favorites } = useGetFavorites({ query: { enabled: isAuthenticated } });
  
  const createChat = useCreateChat();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isFavorited = favorites?.some(f => f.id === id);

  const handleChatWithAgent = () => {
    if (!isAuthenticated) {
      setLocation('/signin');
      return;
    }
    
    createChat.mutate({ data: { listing_id: id } }, {
      onSuccess: (chat) => {
        setLocation(`/dashboard/chats/${chat.id}`);
      },
      onError: (error) => {
        toast({
          title: "Failed to start chat",
          description: error.message || "Something went wrong",
          variant: "destructive"
        });
      }
    });
  };

  const toggleFavorite = () => {
    if (!isAuthenticated) {
      setLocation('/signin');
      return;
    }

    if (isFavorited) {
      removeFavorite.mutate({ data: { listing_id: id } }, {
        onSuccess: () => {
          toast({ title: "Removed from favorites" });
          queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
        }
      });
    } else {
      addFavorite.mutate({ data: { listing_id: id } }, {
        onSuccess: () => {
          toast({ title: "Added to favorites" });
          queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
        }
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title || 'Property on PropertyLo',
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-8 w-32 mb-6" />
        <Skeleton className="w-full h-[50vh] rounded-2xl mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Property not found</h2>
        <Button onClick={() => setLocation('/listings')}>Back to Listings</Button>
      </div>
    );
  }

  const formattedDate = new Date(listing.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Header Actions */}
      <div className="border-b border-border bg-card sticky top-16 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center max-w-6xl">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="h-5 w-5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleFavorite}>
              <Heart className={`h-5 w-5 ${isFavorited ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Title Section */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none text-sm px-3 py-1">
              For {listing.purpose === 'shortlet' ? 'Shortlet' : listing.purpose === 'rent' ? 'Rent' : 'Sale'}
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1 capitalize">
              {listing.type}
            </Badge>
            {listing.label && (
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-sm px-3 py-1">
                {listing.label}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            {listing.title}
          </h1>
          <div className="flex items-center text-muted-foreground text-lg">
            <MapPin className="h-5 w-5 mr-1" />
            {listing.location}, {listing.state}
          </div>
        </div>

        {/* Gallery */}
        <div className="mb-8 bg-muted rounded-2xl overflow-hidden border border-border">
          {listing.images && listing.images.length > 0 ? (
            <div className="relative">
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {listing.images.map((src, i) => (
                    <div key={i} className="relative flex-[0_0_100%] min-w-0">
                      <img 
                        src={src} 
                        alt={`${listing.title} - Image ${i+1}`} 
                        className="w-full h-[40vh] md:h-[60vh] object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
                {emblaApi?.selectedScrollSnap() !== undefined ? emblaApi.selectedScrollSnap() + 1 : 1} / {listing.images.length}
              </div>
            </div>
          ) : (
            <div className="w-full h-[40vh] md:h-[60vh] bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No images available</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Key Features */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold font-display mb-4">Property Features</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {listing.bedrooms && (
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <Bed className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="font-bold text-foreground">{listing.bedrooms}</span>
                    <span className="text-xs text-muted-foreground text-center">Bedrooms</span>
                  </div>
                )}
                {listing.bathrooms && (
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <Bath className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="font-bold text-foreground">{listing.bathrooms}</span>
                    <span className="text-xs text-muted-foreground text-center">Bathrooms</span>
                  </div>
                )}
                {listing.size && (
                  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                    <Maximize className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="font-bold text-foreground">{listing.size}</span>
                    <span className="text-xs text-muted-foreground text-center">Area/Size</span>
                  </div>
                )}
                <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                  <Calendar className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="font-bold text-foreground line-clamp-1">{formattedDate}</span>
                  <span className="text-xs text-muted-foreground text-center">Listed On</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold font-display mb-4">Description</h2>
              <div className="prose prose-sm md:prose-base max-w-none text-muted-foreground whitespace-pre-line">
                {listing.description || "No description provided."}
              </div>
            </div>
          </div>

          {/* Sidebar / Actions */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm md:sticky md:top-36">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Price</div>
              <div className="text-3xl font-bold text-primary font-display mb-6">
                {formatCurrency(listing.price)}
                <span className="text-base font-normal text-muted-foreground ml-1">
                  {listing.purpose === 'rent' ? '/yr' : listing.purpose === 'shortlet' ? '/night' : ''}
                </span>
              </div>

              <div className="space-y-3">
                <Button 
                  size="lg" 
                  className="w-full font-bold h-14" 
                  onClick={handleChatWithAgent}
                  disabled={createChat.isPending || (user && user.id === listing.user_id)}
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  {createChat.isPending ? 'Starting...' : 'Chat with Agent'}
                </Button>
                
                {user && user.id === listing.user_id && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    This is your listing.
                  </p>
                )}

                {(!user || user.id !== listing.user_id) && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Start a secure chat to negotiate or schedule a viewing.
                  </p>
                )}
              </div>

              {(listing.contact_phone || listing.contact_email) && (
                <div className="mt-8 pt-6 border-t border-border space-y-4">
                  <h3 className="font-semibold text-foreground">Direct Contact</h3>
                  {listing.contact_phone && (
                    <div className="flex items-center text-sm">
                      <div className="bg-muted p-2 rounded-md mr-3">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{listing.contact_phone}</span>
                    </div>
                  )}
                  {listing.contact_email && (
                    <div className="flex items-center text-sm">
                      <div className="bg-muted p-2 rounded-md mr-3">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{listing.contact_email}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
