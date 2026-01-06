import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LogOut, BookOpen, CheckCircle, Play, GraduationCap, Video, Loader2, X, MessageSquare, Send, Mail, Reply, ArrowLeft, Clock, Key } from "lucide-react";
import type { Training, TrainingAssignment, Message, VideoWatchLog } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import VideoPlayer from "@/components/VideoPlayer";

const messageSchema = z.object({
  subject: z.string().min(1, "Konu gerekli"),
  content: z.string().min(1, "Mesaj içeriği gerekli"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newPassword: z.string().min(4, "Yeni şifre en az 4 karakter olmalı"),
  confirmPassword: z.string().min(1, "Şifre tekrarı gerekli"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

interface AssignmentWithTraining {
  assignment: TrainingAssignment;
  training: Training;
}

type MessageForm = z.infer<typeof messageSchema>;

export default function ParticipantDashboard() {
  const [, setLocation] = useLocation();
  const { session, participant, logout, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTraining, setSelectedTraining] = useState<AssignmentWithTraining | null>(null);
  const [activeTab, setActiveTab] = useState("trainings");
  const [canComplete, setCanComplete] = useState(false);
  const [initialWatchedTime, setInitialWatchedTime] = useState<number>(0);
  const lastSaveTimeRef = useRef<number>(0);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { data: systemStatus } = useQuery<{ maintenanceMode: boolean }>({
    queryKey: ["/api/system/status"],
  });

  useEffect(() => {
    if (systemStatus?.maintenanceMode) {
      setLocation("/maintenance");
    }
  }, [systemStatus?.maintenanceMode, setLocation]);

  const { data: videoProgress, refetch: refetchProgress, isFetched: isProgressFetched } = useQuery<VideoWatchLog | { watchedSeconds: number; progressPercent: number }>({
    queryKey: ["/api/video-progress", selectedTraining?.assignment.id],
    queryFn: async () => {
      const res = await fetch(`/api/video-progress/${selectedTraining?.assignment.id}`);
      if (!res.ok) throw new Error("Failed to fetch progress");
      return res.json();
    },
    enabled: !!selectedTraining?.assignment.id,
    staleTime: 0,
    refetchOnMount: "always",
  });

  useEffect(() => {
    if (videoProgress && isProgressFetched) {
      setInitialWatchedTime(videoProgress.watchedSeconds);
    }
  }, [videoProgress, isProgressFetched]);

  const saveProgressMutation = useMutation({
    mutationFn: async (data: { assignmentId: string; participantId: string; watchedSeconds: number; progressPercent: number }) => {
      const res = await apiRequest("POST", "/api/video-progress", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-trainings"] });
    },
  });

  const saveVideoProgress = useCallback((assignmentId: string, progress: number, watchedTime: number) => {
    const now = Date.now();
    if (now - lastSaveTimeRef.current < 3000) return;
    lastSaveTimeRef.current = now;
    
    if (session?.participantId) {
      saveProgressMutation.mutate({
        assignmentId,
        participantId: session.participantId,
        watchedSeconds: Math.round(watchedTime),
        progressPercent: Math.round(progress),
      });
    }
  }, [session?.participantId, saveProgressMutation]);

  const handleVideoClose = () => {
    setSelectedTraining(null);
    setInitialWatchedTime(0);
  };

  useEffect(() => {
    if (selectedTraining) {
      setCanComplete(false);
      refetchProgress();
    }
  }, [selectedTraining, refetchProgress]);

  const form = useForm<MessageForm>({
    resolver: zodResolver(messageSchema),
    defaultValues: { subject: "", content: "" },
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { participantId: string; currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/participants/change-password", data);
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

  const { data: myTrainings = [], isLoading } = useQuery<AssignmentWithTraining[]>({
    queryKey: ["/api/my-trainings", session?.participantId],
    queryFn: async () => {
      const res = await fetch(`/api/my-trainings/${session?.participantId}`);
      if (!res.ok) throw new Error("Failed to fetch trainings");
      return res.json();
    },
    enabled: !!session?.participantId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: myMessages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages/participant", session?.participantId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/participant/${session?.participantId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!session?.participantId,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const completeMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await apiRequest("POST", `/api/assignments/${assignmentId}/complete`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-trainings"] });
      toast({ title: "Tebrikler!", description: "Eğitimi başarıyla tamamladınız." });
      setSelectedTraining(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "İşlem sırasında bir hata oluştu.", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: MessageForm) => {
      const res = await apiRequest("POST", "/api/messages", {
        ...data,
        participantId: session?.participantId,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages/participant", session?.participantId] });
      toast({ title: "Mesaj Gönderildi", description: "Mesajınız yönetime iletildi." });
      form.reset();
    },
    onError: () => {
      toast({ title: "Hata", description: "Mesaj gönderilemedi.", variant: "destructive" });
    },
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

  if (!session || session.role !== "participant") {
    setLocation("/participant/login");
    return null;
  }

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const completedCount = myTrainings.filter(t => t.assignment.completed).length;
  const pendingCount = myTrainings.length - completedCount;
  const overallProgress = myTrainings.length > 0 
    ? Math.round((completedCount / myTrainings.length) * 100)
    : 0;

  const getVideoThumbnail = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="p-2 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">Eğitimlerim</h1>
              {participant && (
                <p className="text-xs text-muted-foreground">{participant.fullName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPasswordDialog(true)}
              data-testid="button-change-password"
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
              <span className="hidden sm:inline">Çıkış</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Eğitim
              </CardTitle>
              <BookOpen className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-total-trainings">
                {myTrainings.length}
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
                {completedCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {pendingCount} beklemede
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                İlerleme
              </CardTitle>
              <Clock className="h-5 w-5 text-chart-4" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" data-testid="stat-progress">
                %{overallProgress}
              </div>
              <Progress value={overallProgress} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="w-full justify-start gap-2 bg-transparent p-0 h-auto flex-wrap">
                <TabsTrigger 
                  value="trainings" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid="tab-trainings"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Eğitimlerim
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
              <TabsContent value="trainings" className="mt-0">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-64 w-full" />
                    ))}
                  </div>
                ) : myTrainings.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Henüz eğitim atanmamış</h3>
                    <p className="text-muted-foreground">
                      Yöneticiniz size eğitim atadığında burada görünecek.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myTrainings.map(({ assignment, training }) => {
                      const thumbnail = getVideoThumbnail(training.videoUrl);
                      
                      return (
                        <Card 
                          key={assignment.id} 
                          className={`overflow-hidden ${assignment.completed ? "border-chart-2/50" : ""}`}
                          data-testid={`training-card-${assignment.id}`}
                        >
                          <div className="relative aspect-video bg-muted">
                            {thumbnail ? (
                              <img 
                                src={thumbnail} 
                                alt={training.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Video className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                            {assignment.completed && (
                              <div className="absolute inset-0 bg-chart-2/20 flex items-center justify-center">
                                <div className="bg-chart-2 rounded-full p-2">
                                  <CheckCircle className="h-8 w-8 text-white" />
                                </div>
                              </div>
                            )}
                            {!assignment.completed && (
                              <Button
                                size="icon"
                                className="absolute inset-0 m-auto w-14 h-14 rounded-full"
                                onClick={() => setSelectedTraining({ assignment, training })}
                                data-testid={`button-play-${assignment.id}`}
                              >
                                <Play className="h-6 w-6" />
                              </Button>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-semibold line-clamp-2">{training.title}</h3>
                              <Badge variant={assignment.completed ? "default" : "secondary"} className="shrink-0">
                                {assignment.completed ? "Tamamlandı" : "Bekliyor"}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>İlerleme</span>
                                <span>%{assignment.progress}</span>
                              </div>
                              <Progress value={assignment.progress} className="h-2" />
                            </div>
                            {!assignment.completed && (
                              <Button 
                                className="w-full mt-4"
                                onClick={() => setSelectedTraining({ assignment, training })}
                                data-testid={`button-watch-${assignment.id}`}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                İzle
                              </Button>
                            )}
                            {assignment.completed && assignment.completedAt && (
                              <p className="text-xs text-muted-foreground mt-4">
                                Tamamlanma: {new Date(assignment.completedAt).toLocaleDateString("tr-TR")}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="messages" className="mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Yeni Mesaj Gönder
                    </h3>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit((data) => sendMessageMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Konu</FormLabel>
                              <FormControl>
                                <Input placeholder="Mesaj konusu" data-testid="input-message-subject" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="content"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mesajınız</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Mesajınızı yazın..." 
                                  className="min-h-[120px]"
                                  data-testid="input-message-content"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={sendMessageMutation.isPending}
                          data-testid="button-send-message"
                        >
                          {sendMessageMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Gönderiliyor...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Gönder
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Gönderilen Mesajlar
                    </h3>
                    {loadingMessages ? (
                      <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                          <Skeleton key={i} className="h-24 w-full" />
                        ))}
                      </div>
                    ) : myMessages.length === 0 ? (
                      <div className="text-center py-8 bg-muted/30 rounded-lg">
                        <Mail className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">Henüz mesaj göndermediniz.</p>
                      </div>
                    ) : (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-3 pr-4">
                          {myMessages.map((message) => (
                            <Card key={message.id} className={message.reply ? "border-chart-2/30" : ""}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                                  <h4 className="font-medium">{message.subject}</h4>
                                  <Badge variant={message.reply ? "default" : "secondary"}>
                                    {message.reply ? "Yanıtlandı" : "Bekliyor"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {message.content}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(message.createdAt).toLocaleDateString("tr-TR", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  })}
                                </p>
                                {message.reply && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                                      <Reply className="h-3 w-3" />
                                      <span>Yönetim yanıtı:</span>
                                    </div>
                                    <p className="text-sm bg-primary/5 rounded p-2">
                                      {message.reply}
                                    </p>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </main>

      <Dialog open={!!selectedTraining} onOpenChange={(open) => !open && handleVideoClose()}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <DialogHeader className="p-4 pb-0">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="text-white shrink-0"
                onClick={handleVideoClose}
                data-testid="button-video-back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <DialogTitle className="text-white flex-1">
                {selectedTraining?.training.title}
              </DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="text-white shrink-0"
                onClick={handleVideoClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          {selectedTraining && isProgressFetched ? (
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                className="absolute top-4 left-4 z-10 bg-black/70 text-white border-white/20 hover:bg-black/90"
                onClick={handleVideoClose}
                data-testid="button-video-back-overlay"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Geri Dön
              </Button>
              <VideoPlayer
                videoUrl={selectedTraining.training.videoUrl}
                onCanComplete={setCanComplete}
                assignmentId={selectedTraining.assignment.id}
                initialWatchedTime={videoProgress?.watchedSeconds || 0}
                onProgressChange={(progress, watchedTime) => 
                  saveVideoProgress(selectedTraining.assignment.id, progress, watchedTime)
                }
              />
            </div>
          ) : selectedTraining && (
            <div className="aspect-video flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}
          {selectedTraining && !selectedTraining.assignment.completed && (
            <div className="p-4 bg-black/90 border-t border-white/10">
              {!canComplete ? (
                <div className="text-center">
                  <p className="text-white/70 text-sm">
                    Videoyu izlemeye devam edin - tamamlamak için tüm videoyu izlemeniz gerekiyor
                  </p>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => completeMutation.mutate(selectedTraining.assignment.id)}
                  disabled={completeMutation.isPending}
                  data-testid="button-complete-training"
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Eğitimi Tamamla
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Şifre Değiştir
            </DialogTitle>
          </DialogHeader>
          <Form {...passwordForm}>
            <form 
              onSubmit={passwordForm.handleSubmit((data) => {
                if (session?.participantId) {
                  changePasswordMutation.mutate({
                    participantId: session.participantId,
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword,
                  });
                }
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
                      <Input type="password" data-testid="input-current-password" {...field} />
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
                      <Input type="password" data-testid="input-new-password" {...field} />
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
                      <Input type="password" data-testid="input-confirm-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full"
                disabled={changePasswordMutation.isPending}
                data-testid="button-change-password-submit"
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
