import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useGetListings } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Bed, Bath, SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';

export default function Listings() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // Parse query params for initial state
  const params = new URLSearchParams(searchString);
  const initialSearch = params.get('search') || '';
  const initialPurpose = params.get('purpose') || 'all';
  const initialState = params.get('state') || 'all';
  const initialType = params.get('type') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [purpose, setPurpose] = useState(initialPurpose);
  const [propertyType, setPropertyType] = useState(initialType);
  const [locationState, setLocationState] = useState(initialState);
  
  // Build query params for API
  const queryParams: Record<string, string> = { status: 'active' };
  if (purpose && purpose !== 'all') queryParams.purpose = purpose;
  if (propertyType && propertyType !== 'all') queryParams.type = propertyType;
  if (locationState && locationState !== 'all') queryParams.state = locationState;
  if (searchQuery) queryParams.search = searchQuery;

  const { data: listingsData, isLoading } = useGetListings(queryParams);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newParams = new URLSearchParams();
    if (searchQuery) newParams.set('search', searchQuery);
    if (purpose !== 'all') newParams.set('purpose', purpose);
    if (propertyType !== 'all') newParams.set('type', propertyType);
    if (locationState !== 'all') newParams.set('state', locationState);
    
    setLocation(`/listings${newParams.toString() ? `?${newParams.toString()}` : ''}`);
  };

  // Nigerian states (subset for example)
  const states = ["Lagos", "Abuja", "Rivers", "Oyo", "Ogun", "Ondo", "Enugu", "Kano", "Kaduna"];

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      {/* Search Header */}
      <div className="bg-card border-b border-border sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center bg-muted/50 rounded-lg px-3 focus-within:ring-2 focus-within:ring-primary/20 border border-border/50">
              <Search className="h-5 w-5 text-muted-foreground mr-2" />
              <Input 
                type="text" 
                placeholder="Search state, city, or neighborhood..." 
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap md:flex-nowrap gap-2">
              <Select value={purpose} onValueChange={(val) => { setPurpose(val); }}>
                <SelectTrigger className="w-[120px] md:w-[140px] bg-background">
                  <SelectValue placeholder="Purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Purpose</SelectItem>
                  <SelectItem value="rent">For Rent</SelectItem>
                  <SelectItem value="sale">For Sale</SelectItem>
                  <SelectItem value="shortlet">Shortlet</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={propertyType} onValueChange={(val) => { setPropertyType(val); }}>
                <SelectTrigger className="w-[120px] md:w-[140px] bg-background">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Type</SelectItem>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationState} onValueChange={(val) => { setLocationState(val); }}>
                <SelectTrigger className="w-[120px] md:w-[140px] bg-background">
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any State</SelectItem>
                  {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button type="submit" className="w-full md:w-auto">
                <SlidersHorizontal className="h-4 w-4 mr-2 hidden md:block" />
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-foreground">
            {isLoading ? 'Loading properties...' : `${listingsData?.listings.length || 0} Properties Found`}
          </h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden border border-border">
                <Skeleton className="aspect-[4/3] w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="pt-3 border-t border-border flex justify-between">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-5 w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : listingsData?.listings.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border border-dashed max-w-2xl mx-auto">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium text-foreground mb-2">No properties found</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't find any properties matching your current search criteria.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchQuery(''); setPurpose('all'); setPropertyType('all'); setLocationState('all');
              setLocation('/listings');
            }}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listingsData?.listings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`}>
                <div className="bg-card rounded-xl overflow-hidden border border-border shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col h-full">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <img 
                      src={listing.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80'} 
                      alt={listing.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      <Badge className="bg-background/95 text-foreground hover:bg-background shadow-sm border-none font-medium">
                        {listing.purpose === 'shortlet' ? 'Shortlet' : listing.purpose === 'rent' ? 'For Rent' : 'For Sale'}
                      </Badge>
                      {listing.label && (
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground shadow-sm">
                          {listing.label}
                        </Badge>
                      )}
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
                    
                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                      <div className="font-bold text-lg text-primary">
                        {formatCurrency(listing.price)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {listing.purpose === 'rent' ? '/yr' : listing.purpose === 'shortlet' ? '/night' : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                        {listing.bedrooms ? (
                          <span className="flex items-center gap-1">
                            <Bed className="h-3.5 w-3.5" /> {listing.bedrooms}
                          </span>
                        ) : null}
                        {listing.bathrooms ? (
                          <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" /> {listing.bathrooms}
                          </span>
                        ) : null}
                        {listing.type === 'land' && listing.size ? (
                          <span className="flex items-center gap-1">
                            {listing.size}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
