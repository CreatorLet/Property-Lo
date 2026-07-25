import { useGetFavorites, useRemoveFavorite } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { MapPin, Heart, HeartOff } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getGetFavoritesQueryKey } from '@workspace/api-client-react';

export default function Favorites() {
  const { data: favorites, isLoading } = useGetFavorites();
  const removeFavorite = useRemoveFavorite();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    removeFavorite.mutate({ data: { listing_id: id } }, {
      onSuccess: () => {
        toast({ title: "Removed from favorites" });
        queryClient.invalidateQueries({ queryKey: getGetFavoritesQueryKey() });
      }
    });
  };

  return (
    <DashboardLayout title="Saved Favorites">
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[300px] rounded-xl w-full" />
          ))}
        </div>
      ) : !favorites || favorites.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-border max-w-2xl mx-auto">
          <div className="bg-rose-100 text-rose-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-6">
            Keep track of properties you love by clicking the heart icon on any listing.
          </p>
          <Link href="/listings">
            <Button>Browse Properties</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((listing) => (
            <Link key={listing.id} href={`/listings/${listing.id}`}>
              <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm flex flex-col h-full group hover:shadow-md transition-shadow relative">
                <div className="absolute top-3 right-3 z-10">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 rounded-full bg-background/80 hover:bg-destructive hover:text-destructive-foreground backdrop-blur-sm shadow-sm"
                    onClick={(e) => handleRemove(listing.id, e)}
                  >
                    <HeartOff className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img 
                    src={listing.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80'} 
                    alt={listing.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-background/90 text-foreground hover:bg-background/90 shadow-sm border-none">
                      For {listing.purpose === 'shortlet' ? 'Shortlet' : listing.purpose === 'rent' ? 'Rent' : 'Sale'}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-bold text-base text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>
                  
                  <div className="flex items-center text-muted-foreground text-sm mb-3">
                    <MapPin className="h-3.5 w-3.5 mr-1 shrink-0" />
                    <span className="line-clamp-1">{listing.location}, {listing.state}</span>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-border">
                    <div className="font-bold text-lg text-primary">
                      {formatCurrency(listing.price)}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
