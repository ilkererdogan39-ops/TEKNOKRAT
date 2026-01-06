import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { UserManagement } from "@/components/admin/UserManagement";
import { TrainingAssignment } from "@/components/admin/TrainingAssignment";
import { Reports } from "@/components/admin/Reports";
import { Messages } from "@/components/admin/Messages";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LogOut, Users, BookOpen, BarChart3, GraduationCap, CheckCircle, Clock, Mail, Key, Loader2 } from "lucide-react";
import type { SafeParticipant, TrainingAssignment as TAssignment, Training, Message } from "@shared/schema";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı"),
  confirmPassword: z.string().min(1, "Şifre tekrarı gerekli"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { session, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/admin/change-password", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Şifre değiştirilemedi");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Şifreniz değiştirildi." });
      setShowPasswordDialog(false);
      passwordForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Hata", description: error.message, variant: "destructive" });
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
    setLocation("/admin/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/");
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPasswordDialog(true)}
              data-testid="button-admin-change-password"
            >
              <Key className="h-4 w-4" />
            </Button>
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

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Admin Şifre Değiştir
            </DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form 
              onSubmit={passwordForm.handleSubmit((data) => {
                changePasswordMutation.mutate({
                  currentPassword: data.currentPassword,
                  newPassword: data.newPassword,
                });
              })} 
              className="space-y-4"
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mevcut Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" data-testid="input-admin-current-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre</FormLabel>
                    <FormControl>
                      <Input type="password" data-testid="input-admin-new-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yeni Şifre (Tekrar)</FormLabel>
                    <FormControl>
                      <Input type="password" data-testid="input-admin-confirm-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={changePasswordMutation.isPending}
                data-testid="button-admin-change-password-submit"
              >
                {changePasswordMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Değiştiriliyor...
                  </>
                ) : (
                  "Şifreyi Değiştir"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
