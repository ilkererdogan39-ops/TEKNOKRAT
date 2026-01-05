import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { BookOpen, Trash2, Video, Users, Loader2, Plus, ExternalLink } from "lucide-react";
import { z } from "zod";
import type { SafeParticipant, Training, TrainingAssignment as TAssignment } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

const assignmentFormSchema = z.object({
  title: z.string().min(1, "Eğitim başlığı gerekli"),
  videoUrl: z.string().url("Geçerli bir video URL giriniz"),
  participantIds: z.array(z.string()).min(1, "En az bir katılımcı seçin"),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

export function TrainingAssignment() {
  const { toast } = useToast();
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  const { data: participants = [], isLoading: loadingParticipants } = useQuery<SafeParticipant[]>({
    queryKey: ["/api/participants"],
  });

  const { data: trainings = [], isLoading: loadingTrainings } = useQuery<Training[]>({
    queryKey: ["/api/trainings"],
  });

  const { data: assignments = [] } = useQuery<TAssignment[]>({
    queryKey: ["/api/assignments"],
  });

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      title: "",
      videoUrl: "",
      participantIds: [],
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const res = await apiRequest("POST", "/api/trainings/assign", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      form.reset();
      setSelectedParticipants([]);
      toast({ title: "Eğitim Atandı", description: "Eğitim başarıyla katılımcılara atandı." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Eğitim atanırken bir hata oluştu.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/trainings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Silindi", description: "Eğitim ve atamaları silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Silme işlemi başarısız.", variant: "destructive" });
    },
  });

  const handleParticipantToggle = (participantId: string) => {
    const newSelected = selectedParticipants.includes(participantId)
      ? selectedParticipants.filter(id => id !== participantId)
      : [...selectedParticipants, participantId];
    
    setSelectedParticipants(newSelected);
    form.setValue("participantIds", newSelected);
  };

  const handleSelectAll = () => {
    const allIds = participants.map(p => p.id);
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([]);
      form.setValue("participantIds", []);
    } else {
      setSelectedParticipants(allIds);
      form.setValue("participantIds", allIds);
    }
  };

  const onSubmit = (data: AssignmentFormData) => {
    assignMutation.mutate(data);
  };

  const getAssignmentCount = (trainingId: string) => {
    return assignments.filter(a => a.trainingId === trainingId).length;
  };

  const getCompletedCount = (trainingId: string) => {
    return assignments.filter(a => a.trainingId === trainingId && a.completed).length;
  };

  const getVideoThumbnail = (url: string) => {
    const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    if (youtubeMatch) {
      return `https://img.youtube.com/vi/${youtubeMatch[1]}/mqdefault.jpg`;
    }
    return null;
  };

  return (
    <div className="space-y-8">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Yeni Eğitim Ata
          </CardTitle>
          <CardDescription>
            Video eğitimi ekleyin ve katılımcılara atayın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eğitim Başlığı</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Örn: İş Sağlığı ve Güvenliği" 
                          data-testid="input-training-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video Linki (YouTube veya Vimeo)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://www.youtube.com/watch?v=..." 
                          data-testid="input-training-url"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="participantIds"
                render={() => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel>Hedef Katılımcılar</FormLabel>
                      {participants.length > 0 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={handleSelectAll}
                        >
                          {selectedParticipants.length === participants.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                        </Button>
                      )}
                    </div>
                    {loadingParticipants ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))}
                      </div>
                    ) : participants.length === 0 ? (
                      <div className="text-center py-8 border rounded-lg bg-muted/30">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Henüz katılımcı eklenmemiş
                        </p>
                      </div>
                    ) : (
                      <ScrollArea className="h-48 border rounded-lg p-3">
                        <div className="space-y-2">
                          {participants.map((participant) => (
                            <label
                              key={participant.id}
                              className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                              data-testid={`checkbox-participant-${participant.id}`}
                            >
                              <Checkbox
                                checked={selectedParticipants.includes(participant.id)}
                                onCheckedChange={() => handleParticipantToggle(participant.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{participant.fullName}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {participant.department} - {participant.email}
                                </p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    <FormMessage />
                    {selectedParticipants.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedParticipants.length} katılımcı seçildi
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={assignMutation.isPending || participants.length === 0}
                data-testid="button-assign-training"
              >
                {assignMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Atanıyor...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Eğitimi Ata
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Mevcut Eğitim Atamaları</h3>
        
        {loadingTrainings ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : trainings.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-muted/30">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Henüz eğitim yok</h3>
            <p className="text-muted-foreground">
              Yukarıdaki formu kullanarak eğitim ekleyin.
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Eğitim</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Video</TableHead>
                  <TableHead className="font-semibold text-center">Atanan</TableHead>
                  <TableHead className="font-semibold text-center">Tamamlayan</TableHead>
                  <TableHead className="font-semibold text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainings.map((training) => {
                  const thumbnail = getVideoThumbnail(training.videoUrl);
                  const assignedCount = getAssignmentCount(training.id);
                  const completedCount = getCompletedCount(training.id);
                  
                  return (
                    <TableRow key={training.id} data-testid={`row-training-${training.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {thumbnail ? (
                            <img 
                              src={thumbnail} 
                              alt={training.title}
                              className="w-16 h-10 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-10 bg-muted rounded flex items-center justify-center">
                              <Video className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{training.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <a 
                          href={training.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{training.videoUrl}</span>
                        </a>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          <Users className="h-3 w-3 mr-1" />
                          {assignedCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={completedCount === assignedCount && assignedCount > 0 ? "default" : "outline"}>
                          {completedCount}/{assignedCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              data-testid={`button-delete-training-${training.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Eğitimi Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{training.title}" eğitimini ve tüm atamalarını silmek istediğinize emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(training.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
