import { useState } from 'react';
import { useGetAdminListings, useUpdateListing } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Check, X, ExternalLink } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAdminListingsQueryKey } from '@workspace/api-client-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'wouter';
import { CreateListingButton } from './create-listing';

export default function AdminListings() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: listingsData, isLoading } = useGetAdminListings({ 
    status: statusFilter !== 'all' ? statusFilter : undefined 
  });
  
  const updateListing = useUpdateListing();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleStatusChange = (id: string, newStatus: string) => {
    updateListing.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: `Listing marked as ${newStatus}` });
        queryClient.invalidateQueries({ queryKey: getGetAdminListingsQueryKey() });
      },
      onError: (error) => {
        toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Manage Listings</h1>
          <p className="text-muted-foreground mt-1">Review, approve, and manage all property listings.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Listings</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <CreateListingButton />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">Property</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Price</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Created</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : !listingsData?.listings || listingsData.listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No listings found matching your criteria.
                  </td>
                </tr>
              ) : (
                listingsData.listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground line-clamp-1">{listing.title}</div>
                      <div className="text-muted-foreground text-xs mt-1 capitalize">{listing.type} • For {listing.purpose}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="line-clamp-1">{listing.state}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {formatCurrency(Number(listing.price))}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={listing.status === 'active' ? 'default' : listing.status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">
                        {listing.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/listings/${listing.id}`} target="_blank">
                          <Button variant="ghost" size="icon" title="View Property">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        {listing.status === 'pending' && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleStatusChange(listing.id, 'active')}
                            >
                              <Check className="h-4 w-4 mr-1" /> Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-destructive border-destructive/20 hover:bg-destructive/10"
                              onClick={() => handleStatusChange(listing.id, 'rejected')}
                            >
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                        {listing.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => handleStatusChange(listing.id, 'rejected')}
                          >
                            Suspend
                          </Button>
                        )}
                        {listing.status === 'rejected' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => handleStatusChange(listing.id, 'active')}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
