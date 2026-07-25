import { useGetContactMessages } from '@workspace/api-client-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Mail, Phone, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminContact() {
  const { data: contactData, isLoading } = useGetContactMessages();

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Contact Inbox</h1>
        <p className="text-muted-foreground mt-1">Submissions from the public contact form.</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold w-1/4">Sender</th>
                <th className="px-6 py-4 font-semibold w-1/4">Subject</th>
                <th className="px-6 py-4 font-semibold w-2/4">Message</th>
                <th className="px-6 py-4 font-semibold whitespace-nowrap">Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-10 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-12 w-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))
              ) : !contactData || contactData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-muted-foreground">
                    <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    No contact messages found.
                  </td>
                </tr>
              ) : (
                contactData.map((msg) => (
                  <tr key={msg.id} className="hover:bg-muted/30 transition-colors group items-start">
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-foreground">{msg.first_name} {msg.last_name}</div>
                      <div className="flex items-center text-muted-foreground text-xs mt-1 gap-1">
                        <Mail className="h-3 w-3" /> {msg.email}
                      </div>
                      {msg.phone && (
                        <div className="flex items-center text-muted-foreground text-xs mt-1 gap-1">
                          <Phone className="h-3 w-3" /> {msg.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top font-medium">
                      {msg.subject || <span className="text-muted-foreground italic font-normal">No subject</span>}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="text-foreground text-sm whitespace-pre-line leading-relaxed">
                        {msg.message}
                      </p>
                    </td>
                    <td className="px-6 py-4 align-top text-muted-foreground whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(msg.created_at).toLocaleDateString()}
                      </div>
                      <div className="ml-5">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
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
