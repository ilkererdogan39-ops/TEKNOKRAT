import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BarChart3, Users, CheckCircle, Clock, TrendingUp, RefreshCw, Eye, Download, ChevronRight, LineChart as LineChartIcon } from "lucide-react";
import type { SafeParticipant, Training, TrainingAssignment, VideoWatchLog } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { useToast } from "@/hooks/use-toast";

export function Reports() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedParticipant, setSelectedParticipant] = useState<SafeParticipant | null>(null);
  const { toast } = useToast();
  
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

  const exportToExcel = () => {
    const headers = ["Sicil No", "Ad Soyad", "Departman", "E-Posta", "Atanan Egitim", "Video Ilerleme (%)", "Tamamlandi", "Tamamlanma Tarihi"];
    const rows: string[][] = [];
    
    participants.forEach(participant => {
      const participantAssignments = assignments.filter(a => a.participantId === participant.id);
      if (participantAssignments.length === 0) {
        rows.push([
          participant.employeeId,
          participant.fullName,
          participant.department,
          participant.email,
          "Egitim atanmamis",
          "0",
          "Hayir",
          ""
        ]);
      } else {
        participantAssignments.forEach(assignment => {
          const training = trainings.find(t => t.id === assignment.trainingId);
          rows.push([
            participant.employeeId,
            participant.fullName,
            participant.department,
            participant.email,
            training?.title || "Bilinmeyen Egitim",
            String(assignment.progress || 0),
            assignment.completed ? "Evet" : "Hayir",
            assignment.completedAt ? new Date(assignment.completedAt).toLocaleString("tr-TR") : ""
          ]);
        });
      }
    });
    
    const csvContent = [
      headers.join(";"),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(";"))
    ].join("\n");
    
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `egitim_raporu_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Excel Raporu Indirildi",
      description: "Rapor basariyla CSV formatinda indirildi."
    });
  };

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
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                data-testid="button-export-excel"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel Indir
              </Button>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                Son guncelleme: {lastUpdated.toLocaleTimeString('tr-TR')}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz katılımcı yok</h3>
              <p className="text-muted-foreground">
                Katılımcı ekleyerek başlayın.
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
                          <div className="flex items-center gap-2">
                            {report.total === 0 ? (
                              <Badge variant="outline" className="text-muted-foreground">
                                Egitim Atanmamis
                              </Badge>
                            ) : report.completed === report.total && report.total > 0 ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Tamamlandi
                              </Badge>
                            ) : isActivelyWatching ? (
                              <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300">
                                <Eye className="h-3 w-3 mr-1" />
                                Izliyor
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Clock className="h-3 w-3 mr-1" />
                                Beklemede
                              </Badge>
                            )}
                            {report.total > 0 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedParticipant(participant)}
                                title="Izleme Egrisini Gor"
                                data-testid={`button-view-curve-${participant.id}`}
                              >
                                <LineChartIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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

      <ViewingCurveDialog
        participant={selectedParticipant}
        assignments={assignments}
        trainings={trainings}
        onClose={() => setSelectedParticipant(null)}
      />
    </div>
  );
}

function ViewingCurveDialog({
  participant,
  assignments,
  trainings,
  onClose,
}: {
  participant: SafeParticipant | null;
  assignments: TrainingAssignment[];
  trainings: Training[];
  onClose: () => void;
}) {
  if (!participant) return null;

  const participantAssignments = assignments.filter(a => a.participantId === participant.id);
  
  const chartData = participantAssignments.map(assignment => {
    const training = trainings.find(t => t.id === assignment.trainingId);
    return {
      name: training?.title?.substring(0, 20) + (training?.title && training.title.length > 20 ? "..." : "") || "Egitim",
      ilerleme: assignment.progress || 0,
      tamamlandi: assignment.completed ? 100 : 0,
    };
  });

  const avgProgress = participantAssignments.length > 0
    ? Math.round(participantAssignments.reduce((sum, a) => sum + (a.progress || 0), 0) / participantAssignments.length)
    : 0;

  const completedCount = participantAssignments.filter(a => a.completed).length;

  return (
    <Dialog open={!!participant} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5" />
            {participant.fullName} - Izleme Egrisi
          </DialogTitle>
          <DialogDescription>
            Katilimcinin egitim bazinda video ilerleme durumu
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{participantAssignments.length}</div>
            <div className="text-xs text-muted-foreground">Atanan Egitim</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-chart-2">{completedCount}</div>
            <div className="text-xs text-muted-foreground">Tamamlanan</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold text-primary">%{avgProgress}</div>
            <div className="text-xs text-muted-foreground">Ortalama Ilerleme</div>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }}
                  className="fill-foreground"
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  domain={[0, 100]} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `%${value}`}
                  className="fill-foreground"
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `%${value}`, 
                    name === "ilerleme" ? "Video Ilerleme" : "Tamamlandi"
                  ]}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="ilerleme" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorProgress)" 
                  name="Video Ilerleme"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Bu katilimciya henuz egitim atanmamis.
          </p>
        )}

        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">Egitim Detaylari</h4>
          {participantAssignments.map((assignment) => {
            const training = trainings.find(t => t.id === assignment.trainingId);
            return (
              <div 
                key={assignment.id} 
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{training?.title || "Bilinmeyen Egitim"}</p>
                  <p className="text-xs text-muted-foreground">
                    Atanma: {new Date(assignment.assignedAt).toLocaleDateString("tr-TR")}
                    {assignment.completedAt && (
                      <> - Tamamlama: {new Date(assignment.completedAt).toLocaleDateString("tr-TR")}</>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={assignment.progress || 0} className="w-24 h-2" />
                  <span className={`font-bold text-sm min-w-[40px] text-right ${
                    assignment.completed ? 'text-chart-2' : 'text-primary'
                  }`}>
                    %{assignment.progress || 0}
                  </span>
                  {assignment.completed && (
                    <CheckCircle className="h-4 w-4 text-chart-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
