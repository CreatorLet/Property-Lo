import { useState } from 'react';
import { useGetAdminUsers, useUpdateUserStatus, useDeleteUser } from '@workspace/api-client-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Ban, CheckCircle, Trash2, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAdminUsersQueryKey } from '@workspace/api-client-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const { data: usersData, isLoading } = useGetAdminUsers({ 
    search: debouncedSearch || undefined 
  });
  
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate({ id, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: `User status updated to ${newStatus}` });
        queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
      },
      onError: (error) => {
        toast({ title: "Failed to update", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to completely delete this user? This cannot be undone.")) {
      deleteUser.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "User deleted successfully" });
          queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
        },
        onError: (error) => {
          toast({ title: "Failed to delete", description: error.message, variant: "destructive" });
        }
      });
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Manage Users</h1>
          <p className="text-muted-foreground mt-1">View, suspend, or manage platform users.</p>
        </div>
        <form onSubmit={handleSearch} className="flex w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search email or name..." 
              className="pl-9 bg-card"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" className="ml-2">Search</Button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold">User</th>
                <th className="px-6 py-4 font-semibold">Contact</th>
                <th className="px-6 py-4 font-semibold">Role</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Joined</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2"><Skeleton className="h-4 w-24" /></div>
                    </td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : !usersData || usersData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                usersData.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-border">
                          {user.avatar_base64 && <AvatarImage src={user.avatar_base64} />}
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-foreground">{user.full_name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div>{user.email}</div>
                      {user.phone && <div className="text-xs">{user.phone}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="uppercase text-[10px]">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'} className="capitalize bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        {user.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-2">
                          {user.status === 'active' ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              onClick={() => handleStatusChange(user.id, 'suspended')}
                            >
                              <Ban className="h-4 w-4 mr-1" /> Suspend
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              onClick={() => handleStatusChange(user.id, 'active')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Activate
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => handleDelete(user.id)}
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
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
