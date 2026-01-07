import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { UserManagement } from "@/components/admin/UserManagement";
import { TrainingAssignment } from "@/components/admin/TrainingAssignment";
import { Reports } from "@/components/admin/Reports";
import { Messages } from "@/components/admin/Messages";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, Users, BookOpen, BarChart3, GraduationCap, CheckCircle, Mail, Power } from "lucide-react";
import type { SafeParticipant, TrainingAssignment as TAssignment, Training } from "@shared/schema";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { session, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");

  const { data: systemStatus } = useQuery<{ maintenanceMode: boolean }>({
    queryKey: ["/api/system/status"],
  });

  const maintenanceMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await apiRequest("POST", "/api/system/maintenance", { enabled });
      if (!res.ok) {
        throw new Error("Failed to update maintenance mode");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/status"] });
      toast({
        title: data.maintenanceMode ? "Sistem Kapatıldı" : "Sistem Açıldı",
        description: data.maintenanceMode
          ? "Katılımcılar bakım sayfasını görecek."
          : "Katılımcılar artık sisteme erişebilir.",
      });
    },
  });

  const { data: participants = [] } = useQuery<SafeParticipant[]>({
    queryKey: ["/api/participants"],
  });

  const { data: trainings = [] } = useQuery<Training[]>({
    queryKey: ["/api/trainings"],
  });

  const { data: assignments = [] } = useQuery<TAssignment[]>({
    queryKey: ["/api/assignments"],
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session || session.role !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const completedAssignments = assignments.filter(a => a.completed).length;
  const pendingAssignments = assignments.filter(a => !a.completed).length;
  const completionRate = assignments.length > 0 
    ? Math.round((completedAssignments / assignments.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-semibold hidden sm:block">Yönetim Paneli</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
              <Power className={`h-4 w-4 ${systemStatus?.maintenanceMode ? "text-destructive" : "text-chart-2"}`} />
              <Label htmlFor="maintenance-toggle" className="text-sm cursor-pointer hidden sm:block">
                {systemStatus?.maintenanceMode ? "Kapalı" : "Açık"}
              </Label>
              <Switch
                id="maintenance-toggle"
                checked={!systemStatus?.maintenanceMode}
                onCheckedChange={(checked) => maintenanceMutation.mutate(!checked)}
                disabled={maintenanceMutation.isPending}
                data-testid="switch-maintenance"
              />
            </div>
            <ThemeToggle />
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Katılımcı
              </CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-participants">
                {participants.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktif Eğitimler
              </CardTitle>
              <BookOpen className="h-5 w-5 text-chart-2" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-active-trainings">
                {trainings.length}
              </div>
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
              <div className="text-3xl font-bold" data-testid="stat-completed">
                {completedAssignments}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingAssignments} beklemede
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tamamlanma Oranı
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-completion-rate">
                %{completionRate}
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-chart-2 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start gap-2 bg-transparent p-0 h-auto flex-wrap">
                <TabsTrigger 
                  value="users" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-users"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Katılımcı Yönetimi
                </TabsTrigger>
                <TabsTrigger 
                  value="trainings"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-trainings"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Eğitim Atama
                </TabsTrigger>
                <TabsTrigger 
                  value="reports"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-reports"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Raporlar
                </TabsTrigger>
                <TabsTrigger 
                  value="messages"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-messages"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Mesajlar
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent className="pt-6">
              <TabsContent value="users" className="mt-0">
                <UserManagement />
              </TabsContent>
              <TabsContent value="trainings" className="mt-0">
                <TrainingAssignment />
              </TabsContent>
              <TabsContent value="reports" className="mt-0">
                <Reports />
              </TabsContent>
              <TabsContent value="messages" className="mt-0">
                <Messages />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>

    </div>
  );
}
