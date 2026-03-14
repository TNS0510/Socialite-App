import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Shield, UserPlus, Mail, Loader2, CreditCard, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  email: string;
  role: string;
  full_name?: string;
}

export default function GroupPage() {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDues, setProcessingDues] = useState(false);
  const [duesProcessed, setDuesProcessed] = useState(false);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleProcessDues = async () => {
    setProcessingDues(true);
    try {
      // In a real app, this would be a call to a Supabase Edge Function
      // For this demo, we'll simulate the logic here
      const duesAmount = 50.00;
      const transactions = members.map(member => ({
        description: 'Monthly Membership Dues',
        member_name: member.email,
        amount: duesAmount,
        type: 'in',
        status: 'Completed'
      }));

      const { error } = await supabase
        .from('transactions')
        .insert(transactions);

      if (error) throw error;
      
      setDuesProcessed(true);
      setTimeout(() => setDuesProcessed(false), 3000);
    } catch (error) {
      console.error('Error processing dues:', error);
    } finally {
      setProcessingDues(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">My Group</h2>
          <p className="text-zinc-500 mt-1">Manage your community members and settings.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={handleProcessDues} disabled={processingDues}>
            {processingDues ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : duesProcessed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Process Dues
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Members</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl border border-zinc-100 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                        {member.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900">{member.full_name || member.email.split('@')[0]}</p>
                        <p className="text-xs text-zinc-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        member.role === 'Owner' ? "bg-emerald-100 text-emerald-700" :
                        member.role === 'Admin' ? "bg-blue-100 text-blue-700" :
                        "bg-zinc-100 text-zinc-600"
                      )}>
                        {member.role || 'Member'}
                      </span>
                      <Button variant="ghost" size="icon">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Group Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Group Name</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">Unity Community</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Monthly Dues</p>
                <p className="text-sm font-medium text-zinc-900 mt-1">$50.00 / month</p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Invite Code</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-zinc-100 px-2 py-1 rounded text-sm font-mono">UNITY-2024</code>
                  <Button variant="ghost" size="sm" className="h-7 px-2">Copy</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-white">Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-emerald-100 text-sm mb-4">
                Your group uses 2/3 approval threshold for all help requests.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium">
                <Shield className="h-4 w-4" />
                Verified Community
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
