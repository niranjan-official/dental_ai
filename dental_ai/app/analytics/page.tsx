'use client';

import { MainNav } from '@/components/main-nav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const visitData = [
  { month: 'Jan', visits: 65 },
  { month: 'Feb', visits: 78 },
  { month: 'Mar', visits: 90 },
  { month: 'Apr', visits: 81 },
  { month: 'May', visits: 86 },
  { month: 'Jun', visits: 94 },
];

const treatmentData = [
  { name: 'Checkups', value: 45 },
  { name: 'Root Canals', value: 15 },
  { name: 'Fillings', value: 25 },
  { name: 'Extractions', value: 15 },
];

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function Analytics() {
  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      <main className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8">Analytics Dashboard</h1>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="treatments">Treatments</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Patient Visits Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visitData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="visits"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Treatment Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={treatmentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {treatmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="treatments">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Treatment Success Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {treatmentData.map((treatment, index) => (
                      <div key={treatment.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{treatment.name}</span>
                          <span className="text-muted-foreground">{treatment.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${treatment.value}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}