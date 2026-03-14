import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { History, ArrowUpRight, ArrowDownLeft, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  created_at: string;
  description: string;
  member_name: string;
  amount: number;
  type: 'in' | 'out';
  status: 'Paid' | 'Approved' | 'Pending';
}

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTransactions((prev) => [payload.new as Transaction, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setTransactions((prev) => prev.filter((t) => t.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setTransactions((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Transaction) : t))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Ledger</h2>
          <p className="text-zinc-500 mt-1">Complete history of all group transactions.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction History</CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <div className="h-2 w-2 rounded-full bg-emerald-600" />
              Inflow
            </div>
            <div className="flex items-center gap-1.5 text-red-600 font-medium">
              <div className="h-2 w-2 rounded-full bg-red-600" />
              Outflow
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center">
              <History className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">No transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left py-4 px-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Date</th>
                    <th className="text-left py-4 px-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Description</th>
                    <th className="text-left py-4 px-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Member</th>
                    <th className="text-right py-4 px-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Amount</th>
                    <th className="text-right py-4 px-4 font-bold text-zinc-400 uppercase tracking-widest text-[10px]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-4 px-4 text-zinc-500">{formatDate(tx.created_at)}</td>
                      <td className="py-4 px-4 font-medium text-zinc-900">{tx.description}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-[10px] font-bold">
                            {tx.member_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          {tx.member_name}
                        </div>
                      </td>
                      <td className={`py-4 px-4 text-right font-bold ${tx.type === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === 'in' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          tx.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                          tx.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
