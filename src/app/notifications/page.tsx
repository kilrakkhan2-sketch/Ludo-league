
'use client';

import { useMemo } from 'react';
import { AppShell } from "@/components/layout/AppShell";
import { useUser, useCollection } from "@/firebase";
import { useFirebase } from "@/firebase/provider";
import { writeBatch, doc } from 'firebase/firestore';
import type { PersonalNotification } from "@/types";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();

  const { data: notifications, loading } = useCollection<PersonalNotification>(
    user ? `users/${user.uid}/personal_notifications` : undefined,
    { orderBy: ['createdAt', 'desc'], limit: 50 }
  );

  const unreadCount = useMemo(() => {
    return notifications?.filter(n => !n.isRead).length || 0;
  }, [notifications]);

  const handleMarkAllAsRead = async () => {
    if (!firestore || !user || !notifications || unreadCount === 0) return;

    const batch = writeBatch(firestore);
    notifications.forEach(notification => {
      if (!notification.isRead) {
        const notifRef = doc(firestore, `users/${user.uid}/personal_notifications`, notification.id);
        batch.update(notifRef, { isRead: true });
      }
    });
    await batch.commit();
  };

  return (
    <AppShell pageTitle="Notifications" showBackButton>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Alerts</h2>
            <Button 
                variant="outline" 
                size="sm" 
                onClick={handleMarkAllAsRead}
                disabled={unreadCount === 0}
            >
                <CheckCheck className="mr-2 h-4 w-4" /> Mark all as read
            </Button>
        </div>

        <div className="space-y-3">
          {loading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          {!loading && notifications && notifications.length > 0 ? (
            notifications.map(notif => {
              const NotificationCard = (
                <Card 
                  key={notif.id} 
                  className={cn(
                    "transition-colors",
                    !notif.isRead && "bg-primary/10 border-primary/20"
                  )}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    {!notif.isRead && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0" />}
                    <div className={cn("flex-grow", notif.isRead && "ml-5")}>
                      <p className="font-semibold">{notif.title}</p>
                      <p className="text-sm text-muted-foreground">{notif.body}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );

              if (notif.link) {
                return <Link href={notif.link} key={notif.id}>{NotificationCard}</Link>;
              }
              return NotificationCard;
            })
          ) : (
            !loading && (
              <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg bg-card mt-8">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Notifications Yet</h3>
                <p className="text-muted-foreground mt-1 text-sm">Important updates about your matches and account will appear here.</p>
              </div>
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
