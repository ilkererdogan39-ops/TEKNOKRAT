import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3, Users, CheckCircle, Clock, TrendingUp, RefreshCw, Eye } from "lucide-react";
import type { SafeParticipant, Training, TrainingAssignment } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export function Reports() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  const { data: participants = [], isLoading: loadingParticipants, dataUpdatedAt: participantsUpdatedAt } = useQuery<SafeParticipant[]>({
    queryKey: ["/api/participants"],
    refetchInterval: 5000,
  });

  const { data: trainings = [], isLoading: loadingTrainings, dataUpdatedAt: trainingsUpdatedAt } = useQuery<Training[]>({
    queryKey: ["/api/trainings"],
    refetchInterval: 5000,
  });

  const { data: assignments = [], isLoading: loadingAssignments, dataUpdatedAt: assignmentsUpdatedAt } = useQuery<TrainingAssignment[]>({
    queryKey: ["/api/assignments"],
    refetchInterval: 5000,
  });

  useEffect(() => {
    const maxUpdatedAt = Math.max(participantsUpdatedAt || 0, trainingsUpdatedAt || 0, assignmentsUpdatedAt || 0);
    if (maxUpdatedAt > 0) {
      setLastUpdated(new Date(maxUpdatedAt));
    }
  }, [participantsUpdatedAt, trainingsUpdatedAt, assignmentsUpdatedAt]);

  const isLoading = loadingParticipants || loadingTrainings || loadingAssignments;

  const getParticipantReport = (participantId: string) => {
    const participantAssignments = assignments.filter(a => a.participantId === participantId);
    const completed = participantAssignments.filter(a => a.completed).length;
    const total = participantAssignments.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const avgProgress = total > 0 
      ? Math.round(participantAssignments.reduce((sum, a) => sum + (a.progress || 0), 0) / total)
      : 0;
    
    return {
      total,
      completed,
      pending: total - completed,
      rate: completionRate,
      avgProgress,
      trainings: participantAssignments.map(a => ({
        assignment: a,
        training: trainings.find(t => t.id === a.trainingId),
      })),
    };
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500", "bg-green-500", "bg-purple-500", 
      "bg-orange-500", "bg-pink-500", "bg-teal-500"
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const totalAssigned = assignments.length;
  const totalCompleted = assignments.filter(a => a.completed).length;
  const overallRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Atama
            </CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAssigned}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {participants.length} katılımcı, {trainings.length} eğitim
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tamamlanan
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCompleted}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalAssigned - totalCompleted} beklemede
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Genel Oran
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">%{overallRate}</div>
            <Progress value={overallRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Katılımcı Bazlı Rapor
                <Badge variant="outline" className="ml-2 animate-pulse">
                  <Eye className="h-3 w-3 mr-1" />
                  Canlı
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Her katılımcının eğitim tamamlama durumu (5 saniyede bir güncellenir)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Son güncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz eğitim atanmamış</h3>
              <p className="text-muted-foreground">
                Katılımcılara eğitim atayarak başlayın.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Katılımcı</TableHead>
                    <TableHead className="font-semibold">Video İlerlemesi</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...participants]
                    .filter(p => {
                      const report = getParticipantReport(p.id);
                      return report.total > 0;
                    })
                    .sort((a, b) => {
                      const reportA = getParticipantReport(a.id);
                      const reportB = getParticipantReport(b.id);
                      if (reportA.avgProgress > 0 && reportA.avgProgress < 100 && reportB.avgProgress === 0) return -1;
                      if (reportB.avgProgress > 0 && reportB.avgProgress < 100 && reportA.avgProgress === 0) return 1;
                      return reportB.avgProgress - reportA.avgProgress;
                    })
                    .map((participant) => {
                    const report = getParticipantReport(participant.id);
                    const isActivelyWatching = report.avgProgress > 0 && report.avgProgress < 100 && report.pending > 0;
                    
                    return (
                      <TableRow 
                        key={participant.id} 
                        data-testid={`report-row-${participant.id}`}
                        className={isActivelyWatching ? "bg-green-50 dark:bg-green-950/30" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={`${getAvatarColor(participant.fullName)} text-white text-xs`}>
                                  {getInitials(participant.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              {isActivelyWatching && (
                                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{participant.fullName}</p>
                              <p className="text-xs text-muted-foreground">{participant.department}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={report.avgProgress} className="h-3 flex-1 min-w-[80px]" />
                            <span className={`text-lg font-bold min-w-[50px] text-right ${
                              report.avgProgress >= 90 ? 'text-green-600 dark:text-green-400' : 
                              report.avgProgress > 0 ? 'text-blue-600 dark:text-blue-400' : 
                              'text-muted-foreground'
                            }`}>
                              %{report.avgProgress}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {report.completed === report.total && report.total > 0 ? (
                            <Badge className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Tamamlandı
                            </Badge>
                          ) : isActivelyWatching ? (
                            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300">
                              <Eye className="h-3 w-3 mr-1" />
                              İzliyor
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Beklemede
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Eğitim Bazlı İstatistikler
          </CardTitle>
          <CardDescription>
            Her eğitimin departman bazında tamamlanma durumu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trainings.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz eğitim yok</h3>
              <p className="text-muted-foreground">
                Eğitim atayarak başlayın.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {trainings.map((training) => {
                const trainingAssignments = assignments.filter(a => a.trainingId === training.id);
                const departments = Array.from(new Set(
                  trainingAssignments
                    .map(a => participants.find(p => p.id === a.participantId)?.department)
                    .filter((d): d is string => Boolean(d))
                ));

                const chartData = departments.map(dept => {
                  const deptAssignments = trainingAssignments.filter(a => {
                    const participant = participants.find(p => p.id === a.participantId);
                    return participant?.department === dept;
                  });
                  const total = deptAssignments.length;
                  const completed = deptAssignments.filter(a => a.completed).length;
                  const avgProgress = total > 0
                    ? Math.round(deptAssignments.reduce((sum, a) => sum + (a.progress || 0), 0) / total)
                    : 0;
                  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

                  return {
                    department: dept,
                    "Video İzleme": avgProgress,
                    "Tamamlanma": completionRate,
                    total,
                    completed,
                  };
                });

                const totalAssigned = trainingAssignments.length;
                const totalCompleted = trainingAssignments.filter(a => a.completed).length;

                return (
                  <div 
                    key={training.id} 
                    className="p-4 border rounded-lg"
                    data-testid={`training-stat-${training.id}`}
                  >
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h4 className="font-medium text-lg">{training.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {totalAssigned} Katılımcı
                        </Badge>
                        <Badge variant={totalCompleted === totalAssigned && totalAssigned > 0 ? "default" : "secondary"}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {totalCompleted} Tamamlandı
                        </Badge>
                      </div>
                    </div>
                    {chartData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis 
                              dataKey="department" 
                              tick={{ fontSize: 12 }}
                              className="fill-foreground"
                            />
                            <YAxis 
                              domain={[0, 100]} 
                              tick={{ fontSize: 12 }}
                              tickFormatter={(value) => `%${value}`}
                              className="fill-foreground"
                            />
                            <Tooltip 
                              formatter={(value: number, name: string) => [`%${value}`, name]}
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px'
                              }}
                              labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Legend />
                            <Bar 
                              dataKey="Video İzleme" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar 
                              dataKey="Tamamlanma" 
                              fill="hsl(var(--chart-2))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Bu eğitime henüz katılımcı atanmamış.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
