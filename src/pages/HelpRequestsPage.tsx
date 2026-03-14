import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { HandHelping, ThumbsUp, ThumbsDown, Loader2, User, Calendar, DollarSign, FileText, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { GoogleGenAI } from '@google/genai';

interface HelpRequest {
  id: string;
  created_at: string;
  category: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  document_url: string | null;
  votes_yes: number;
  votes_no: number;
  user_email?: string;
  ai_score?: number;
  ai_analysis?: string;
}

export default function HelpRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [scanningId, setScanningId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('help_requests')
        .select(`
          *,
          users (email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedData = data.map((r: any) => ({
        ...r,
        user_email: r.users?.email
      }));
      
      setRequests(formattedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const channel = supabase
      .channel('help_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'help_requests' },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleScan = async (request: HelpRequest) => {
    setScanningId(request.id);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this mutual aid request for potential fraud or inconsistency. 
        Category: ${request.category}
        Amount: $${request.amount}
        Reason: ${request.reason}
        
        Provide a JSON response with:
        1. score: 0-100 (100 being most likely legitimate)
        2. analysis: a brief 2-sentence explanation of your findings.`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text);
      
      await supabase
        .from('help_requests')
        .update({
          ai_score: result.score,
          ai_analysis: result.analysis
        })
        .eq('id', request.id);

      fetchRequests();
    } catch (error) {
      console.error('AI Scan error:', error);
    } finally {
      setScanningId(null);
    }
  };

  const handleVote = async (requestId: string, voteType: 'yes' | 'no') => {
    if (!user) return;
    setVotingId(requestId);

    try {
      // Check if user already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('*')
        .eq('request_id', requestId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        alert('You have already voted on this request.');
        return;
      }

      // Record the vote
      const { error: voteError } = await supabase
        .from('votes')
        .insert([{ request_id: requestId, user_id: user.id, vote_type: voteType }]);

      if (voteError) throw voteError;

      // Update the request vote count
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const updates = voteType === 'yes' 
        ? { votes_yes: (request.votes_yes || 0) + 1 }
        : { votes_no: (request.votes_no || 0) + 1 };

      const { error: updateError } = await supabase
        .from('help_requests')
        .update(updates)
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Check for 2/3 majority (assuming 24 members as per dashboard mock)
      // In a real app, we'd count active members
      const totalVotes = (updates.votes_yes || request.votes_yes || 0) + (updates.votes_no || request.votes_no || 0);
      const yesVotes = updates.votes_yes || request.votes_yes || 0;
      
      if (yesVotes >= 16) { // 2/3 of 24
        await supabase
          .from('help_requests')
          .update({ status: 'approved' })
          .eq('id', requestId);
          
        // Create a transaction
        await supabase.from('transactions').insert([{
          description: `Help Request Approved: ${request.category}`,
          member_name: request.user_email || 'Member',
          amount: -request.amount,
          type: 'out',
          status: 'Approved'
        }]);
      }

    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVotingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Governance</h2>
        <p className="text-zinc-500 mt-1">Review and vote on community help requests.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : requests.length === 0 ? (
        <Card className="border-dashed border-2 bg-zinc-50/50">
          <CardContent className="py-12 text-center">
            <HandHelping className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium">No help requests to review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map((request) => (
            <Card key={request.id} className={cn(
              "overflow-hidden transition-all",
              request.status === 'approved' ? "border-emerald-200 bg-emerald-50/30" :
              request.status === 'rejected' ? "border-red-200 bg-red-50/30" : ""
            )}>
              <CardHeader className="border-b border-zinc-100 bg-zinc-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                      {request.user_email?.[0].toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-base">{request.user_email}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                    request.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                    request.status === 'rejected' ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  )}>
                    {request.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <DollarSign className="h-5 w-5" />
                      <span className="text-2xl">${request.amount.toFixed(2)}</span>
                      <span className="text-zinc-400 font-medium text-sm ml-2">for {request.category}</span>
                    </div>
                    <p className="text-zinc-600 leading-relaxed">
                      {request.reason}
                    </p>
                    {request.document_url && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        View Support Document
                      </Button>
                    )}

                    <div className="pt-4 border-t border-zinc-100">
                      {request.ai_score !== undefined ? (
                        <div className={cn(
                          "p-4 rounded-xl border flex gap-4 items-start",
                          request.ai_score >= 70 ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
                        )}>
                          {request.ai_score >= 70 ? (
                            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-zinc-900">AI Trust Score: {request.ai_score}/100</span>
                              <Sparkles className="h-3 w-3 text-emerald-600" />
                            </div>
                            <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                              {request.ai_analysis}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => handleScan(request)}
                          disabled={scanningId === request.id}
                        >
                          {scanningId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Scan for Fraud
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl border border-zinc-100 p-4 space-y-4 shadow-sm">
                      <h4 className="text-sm font-bold text-zinc-900">Voting Progress</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-emerald-600">Yes: {request.votes_yes || 0}</span>
                          <span className="text-red-600">No: {request.votes_no || 0}</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-500" 
                            style={{ width: `${((request.votes_yes || 0) / 16) * 100}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-zinc-400 text-center">16 votes required for approval</p>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <Button 
                            variant="outline" 
                            className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
                            onClick={() => handleVote(request.id, 'no')}
                            disabled={votingId === request.id}
                          >
                            {votingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4" />}
                            No
                          </Button>
                          <Button 
                            className="gap-2"
                            onClick={() => handleVote(request.id, 'yes')}
                            disabled={votingId === request.id}
                          >
                            {votingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                            Yes
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
