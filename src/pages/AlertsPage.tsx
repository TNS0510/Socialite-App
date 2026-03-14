import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Bell, AlertTriangle, Info, CheckCircle2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Alert {
  id: string;
  type: 'urgent' | 'info' | 'success';
  title: string;
  desc: string;
  created_at: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel('alerts_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alerts' },
        (payload) => {
          console.log('Change received!', payload);
          if (payload.eventType === 'INSERT') {
            setAlerts((prev) => [payload.new as Alert, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setAlerts((prev) =>
              prev.map((a) => (a.id === payload.new.id ? (payload.new as Alert) : a))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'urgent': return AlertTriangle;
      case 'info': return Info;
      case 'success': return CheckCircle2;
      default: return Bell;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'urgent': return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' };
      case 'info': return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' };
      case 'success': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' };
      default: return { color: 'text-zinc-600', bg: 'bg-zinc-50', border: 'border-zinc-100' };
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Alerts</h2>
        <p className="text-zinc-500 mt-1">Stay updated on community needs and activities.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : alerts.length === 0 ? (
        <Card className="border-dashed border-2 bg-zinc-50/50">
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">No alerts at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const Icon = getIcon(alert.type);
            const styles = getColor(alert.type);
            return (
              <Card key={alert.id} className={`${styles.bg} ${styles.border} border shadow-none`}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className={`h-10 w-10 rounded-xl ${styles.bg} border ${styles.border} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-5 w-5 ${styles.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-zinc-900">{alert.title}</h3>
                        <span className="text-xs text-zinc-500 font-medium">{formatTime(alert.created_at)}</span>
                      </div>
                      <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{alert.desc}</p>
                      <div className="mt-4 flex gap-3">
                        <button className="text-xs font-bold text-zinc-900 hover:underline">View Details</button>
                        <button className="text-xs font-bold text-zinc-400 hover:text-zinc-600">Dismiss</button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
