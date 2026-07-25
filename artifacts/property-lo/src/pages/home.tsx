import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useGetAds, useGetListings, useGetListingStats } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Home as HomeIcon, Building, ArrowRight, Bed, Bath, Maximize } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('all');

  const { data: ads, isLoading: adsLoading } = useGetAds();
  const { data: listingsData, isLoading: listingsLoading } = useGetListings({ status: 'active', limit: "6" });
  const { data: stats } = useGetListingStats();

  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (searchType !== 'all') params.set('purpose', searchType);
    setLocation(`/listings?${params.toString()}`);
  };

  const activeAds = ads?.filter(ad => ad.is_active) || [];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-muted">
        <div className="h-[60vh] md:h-[70vh] w-full bg-sidebar flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80')] bg-cover bg-center" />
          <div className="text-center px-4 z-10">
            <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4">
              Find Your Next Home in <span className="text-secondary">Nigeria</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Discover properties for rent, sale, or shortlet. Authentic listings from trusted agents and landlords.
            </p>
          </div>
        </div>

        {/* Search Bar - overlapping the hero on md+ */}
        <div className="relative md:absolute md:-bottom-8 left-0 w-full px-4 z-20 py-4 md:py-0">
          <div className="max-w-4xl mx-auto bg-card rounded-2xl shadow-xl p-4 border border-border">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 flex items-center bg-muted/50 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-shadow">
                <Search className="h-5 w-5 text-muted-foreground mr-3" />
                <Input 
                  type="text" 
                  placeholder="Search state, city, or neighborhood..." 
                  className="border-0 bg-transparent shadow-none focus-visible:ring-0 p-0 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="flex bg-muted/50 rounded-xl p-1 shrink-0">
                  <Button 
                    type="button" 
                    variant={searchType === 'all' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="rounded-lg"
                    onClick={() => setSearchType('all')}
                  >
                    All
                  </Button>
                  <Button 
                    type="button" 
                    variant={searchType === 'rent' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="rounded-lg"
                    onClick={() => setSearchType('rent')}
                  >
                    Rent
                  </Button>
                  <Button 
                    type="button" 
                    variant={searchType === 'sale' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="rounded-lg"
                    onClick={() => setSearchType('sale')}
                  >
                    Sale
                  </Button>
                </div>
                <Button type="submit" size="lg" className="rounded-xl px-8">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="pt-8 md:pt-24 pb-16 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-border/50 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-display font-bold text-primary">{stats?.active || '1,000+'}</p>
              <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-display font-bold text-primary">{stats?.houses || '500+'}</p>
              <p className="text-sm font-medium text-muted-foreground">Houses</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-display font-bold text-primary">{stats?.apartments || '300+'}</p>
              <p className="text-sm font-medium text-muted-foreground">Apartments</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-display font-bold text-primary">{stats?.locations?.length || '36'}</p>
              <p className="text-sm font-medium text-muted-foreground">States Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Sponsored Ads */}
      {(adsLoading || activeAds.length > 0) && (
        <section className="py-10 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Sponsored</p>
            {adsLoading ? (
              <Skeleton className="w-full h-[260px] md:h-[360px] rounded-2xl" />
            ) : (
              <div className="overflow-hidden rounded-2xl shadow-lg" ref={emblaRef}>
                <div className="flex">
                   {activeAds.map((ad) => {
                     const adContent = (
                       <div className="relative h-[260px] w-full md:h-[360px]">
                        <img
                          src={ad.image_url}
                          alt={ad.title || "Advertisement"}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        {ad.title && (
                          <div className="absolute bottom-8 left-0 w-full text-center px-4">
                            <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-4 drop-shadow-lg">
                              {ad.title}
                            </h2>
                            {ad.redirect_url && (
                               <span className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary/90">
                                 Learn More
                               </span>
                            )}
                          </div>
                        )}
                      </div>
                     );

                     return (
                       <div key={ad.id} className="relative min-w-0 flex-[0_0_100%]">
                         {ad.redirect_url ? (
                           <a
                             href={ad.redirect_url}
                             target="_blank"
                             rel="noopener noreferrer"
                             aria-label={`Open sponsored ad${ad.title ? `: ${ad.title}` : ''}`}
                             className="block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                           >
                             {adContent}
                           </a>
                         ) : (
                           adContent
                         )}
                    </div>
                     );
                   })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Properties */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground">Featured Properties</h2>
              <p className="text-muted-foreground mt-2">Discover our hand-picked selection of premium listings.</p>
            </div>
            <Link href="/listings">
              <Button variant="ghost" className="hidden md:flex gap-2">
                View all <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {listingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : listingsData?.listings.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border">
              <HomeIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground">No listings available</h3>
              <p className="text-muted-foreground">Check back later for new properties.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {listingsData?.listings.map((listing) => (
                <Link key={listing.id} href={`/listings/${listing.id}`}>
                  <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col hover:-translate-y-1">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img 
                        src={listing.images[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80'} 
                        alt={listing.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <Badge className="bg-background/90 text-foreground backdrop-blur-sm hover:bg-background/90 shadow-sm border-none">
                          For {listing.purpose === 'shortlet' ? 'Shortlet' : listing.purpose === 'rent' ? 'Rent' : 'Sale'}
                        </Badge>
                        <Badge variant="secondary" className="shadow-sm">
                          {listing.type === 'house' ? 'House' : listing.type === 'apartment' ? 'Apartment' : 'Land'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h3 className="font-display font-bold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {listing.title}
                        </h3>
                      </div>
                      
                      <div className="flex items-center text-muted-foreground text-sm mb-4">
                        <MapPin className="h-4 w-4 mr-1 shrink-0" />
                        <span className="line-clamp-1">{listing.location}, {listing.state}</span>
                      </div>
                      
                      <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                        <div className="font-bold text-xl text-primary">
                          {formatCurrency(listing.price)}
                          {listing.purpose === 'rent' && <span className="text-sm font-normal text-muted-foreground">/yr</span>}
                          {listing.purpose === 'shortlet' && <span className="text-sm font-normal text-muted-foreground">/night</span>}
                        </div>
                        
                        {(listing.bedrooms || listing.bathrooms) && (
                          <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
                            {listing.bedrooms && (
                              <span className="flex items-center gap-1" title="Bedrooms">
                                <Bed className="h-4 w-4" /> {listing.bedrooms}
                              </span>
                            )}
                            {listing.bathrooms && (
                              <span className="flex items-center gap-1" title="Bathrooms">
                                <Bath className="h-4 w-4" /> {listing.bathrooms}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center md:hidden">
            <Link href="/listings">
              <Button variant="outline" className="w-full">
                View all properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')] bg-cover bg-center" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Are you a Landlord or Agent?</h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10">
            List your properties on PropertyLo and reach thousands of potential tenants and buyers across Nigeria.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold px-8 h-14 text-lg">
                Create an Account
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 h-14 text-lg">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
