import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Users, HandHelping, TrendingUp, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const stats = [
    { label: 'Group Balance', value: '$12,450', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Members', value: '24', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Requests', value: '3', icon: HandHelping, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Urgent Alerts', value: '1', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">Dashboard</h2>
        <p className="text-zinc-500 mt-1">Welcome back to your community hub.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-zinc-900 mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-4 pb-6 border-b border-zinc-100 last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-xs">
                    JD
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">John Doe paid dues</p>
                    <p className="text-xs text-zinc-500 mt-0.5">2 hours ago</p>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">+$50.00</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 font-medium text-sm hover:bg-emerald-100 transition-colors flex items-center justify-between">
              Request Help
              <HandHelping className="h-4 w-4" />
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium text-sm hover:bg-blue-100 transition-colors flex items-center justify-between">
              Pay Dues
              <TrendingUp className="h-4 w-4" />
            </button>
            <button className="w-full text-left px-4 py-3 rounded-xl bg-zinc-50 text-zinc-700 font-medium text-sm hover:bg-zinc-100 transition-colors flex items-center justify-between">
              Invite Member
              <Users className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
