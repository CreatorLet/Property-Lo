import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useUpdateProfile, useUpdatePassword, useUpdateAvatar } from '@workspace/api-client-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(6, "New password must be at least 6 characters"),
  confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export default function Profile() {
  const { user, saveAuth, token } = useAuth();
  const { toast } = useToast();
  
  const updateProfile = useUpdateProfile();
  const updatePassword = useUpdatePassword();
  const updateAvatar = useUpdateAvatar();

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || "",
      phone: user?.phone || "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfile.mutate({ data }, {
      onSuccess: (updatedUser) => {
        if (token) saveAuth(token, updatedUser);
        toast({ title: "Profile updated successfully" });
      },
      onError: (error) => {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      }
    });
  };

  const onPasswordSubmit = (data: z.infer<typeof passwordSchema>) => {
    updatePassword.mutate({ 
      data: { current_password: data.current_password, new_password: data.new_password } 
    }, {
      onSuccess: () => {
        toast({ title: "Password updated successfully" });
        passwordForm.reset();
      },
      onError: (error) => {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      }
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Avatar must be under 2MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updateAvatar.mutate({ data: { avatar_base64: result } }, {
          onSuccess: (updatedUser) => {
            if (token) saveAuth(token, updatedUser);
            toast({ title: "Avatar updated" });
          },
          onError: (error) => {
            toast({ title: "Update failed", description: error.message, variant: "destructive" });
          }
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <DashboardLayout title="Profile Settings">
      <div className="space-y-8 max-w-3xl">
        
        {/* Avatar Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-6">
          <div className="relative group">
            <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
              {user?.avatar_base64 && <AvatarImage src={user.avatar_base64} alt={user.full_name} />}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="h-6 w-6" />
              <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
          <div>
            <h3 className="font-semibold text-lg">{user?.full_name}</h3>
            <p className="text-muted-foreground text-sm mb-2">{user?.email}</p>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs uppercase tracking-wider">{user?.role}</Badge>
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display mb-6">Personal Information</h2>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4 max-w-md">
              <FormField
                control={profileForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-2">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Password */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold font-display mb-6">Change Password</h2>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
              <FormField
                control={passwordForm.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-2">
                <Button type="submit" variant="secondary" disabled={updatePassword.isPending}>
                  {updatePassword.isPending ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Form>
        </div>

      </div>
    </DashboardLayout>
  );
}
