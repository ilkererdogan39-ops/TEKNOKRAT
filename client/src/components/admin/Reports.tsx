import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BarChart3, Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import type { SafeParticipant, Training, TrainingAssignment } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function Reports() {
  const { data: participants = [], isLoading: loadingParticipants } = useQuery<SafeParticipant[]>({
    queryKey: ["/api/participants"],
  });

  const { data: trainings = [], isLoading: loadingTrainings } = useQuery<Training[]>({
    queryKey: ["/api/trainings"],
  });

  const { data: assignments = [], isLoading: loadingAssignments } = useQuery<TrainingAssignment[]>({
    queryKey: ["/api/assignments"],
  });

  const isLoading = loadingParticipants || loadingTrainings || loadingAssignments;

  const getParticipantReport = (participantId: string) => {
    const participantAssignments = assignments.filter(a => a.participantId === participantId);
    const completed = participantAssignments.filter(a => a.completed).length;
    const total = participantAssignments.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      pending: total - completed,
      rate,
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
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Katılımcı Bazlı Rapor
          </CardTitle>
          <CardDescription>
            Her katılımcının eğitim tamamlama durumu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz veri yok</h3>
              <p className="text-muted-foreground">
                Katılımcı ve eğitim ekleyerek başlayın.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Katılımcı</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Departman</TableHead>
                    <TableHead className="font-semibold text-center">Atanan</TableHead>
                    <TableHead className="font-semibold text-center">Tamamlanan</TableHead>
                    <TableHead className="font-semibold">İlerleme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => {
                    const report = getParticipantReport(participant.id);
                    
                    return (
                      <TableRow key={participant.id} data-testid={`report-row-${participant.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={`${getAvatarColor(participant.fullName)} text-white text-xs`}>
                                {getInitials(participant.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{participant.fullName}</p>
                              <p className="text-xs text-muted-foreground">{participant.employeeId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{participant.department}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{report.total}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={report.completed === report.total && report.total > 0 ? "default" : "secondary"}>
                            {report.completed}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 min-w-[150px]">
                            <Progress value={report.rate} className="h-2 flex-1" />
                            <span className="text-sm font-medium w-12 text-right">
                              %{report.rate}
                            </span>
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
            Her eğitimin tamamlanma durumu
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
            <div className="space-y-4">
              {trainings.map((training) => {
                const trainingAssignments = assignments.filter(a => a.trainingId === training.id);
                const completed = trainingAssignments.filter(a => a.completed).length;
                const total = trainingAssignments.length;
                const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <div 
                    key={training.id} 
                    className="p-4 border rounded-lg"
                    data-testid={`training-stat-${training.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{training.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Users className="h-3 w-3 mr-1" />
                          {total}
                        </Badge>
                        <Badge variant={rate === 100 && total > 0 ? "default" : "secondary"}>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {completed}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={rate} className="h-2 flex-1" />
                      <span className="text-sm font-medium w-12 text-right">
                        %{rate}
                      </span>
                    </div>
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
