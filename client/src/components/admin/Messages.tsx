import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Mail, MessageSquare, Send, Clock, CheckCircle, Reply, Loader2, Inbox } from "lucide-react";
import type { Message, SafeParticipant } from "@shared/schema";

const replySchema = z.object({
  reply: z.string().min(1, "Yanıt gerekli"),
});

type ReplyForm = z.infer<typeof replySchema>;

export function Messages() {
  const { toast } = useToast();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const { data: participants = [] } = useQuery<SafeParticipant[]>({
    queryKey: ["/api/participants"],
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/messages/${id}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: async ({ id, reply }: { id: string; reply: string }) => {
      const res = await apiRequest("POST", `/api/messages/${id}/reply`, { reply });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({ title: "Yanıt Gönderildi", description: "Mesaj yanıtlandı." });
      setSelectedMessage(null);
    },
    onError: () => {
      toast({ title: "Hata", description: "Yanıt gönderilemedi.", variant: "destructive" });
    },
  });

  const form = useForm<ReplyForm>({
    resolver: zodResolver(replySchema),
    defaultValues: { reply: "" },
  });

  const getParticipant = (participantId: string) => {
    return participants.find(p => p.id === participantId);
  };

  const handleOpenMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsReadMutation.mutate(message.id);
    }
    form.reset({ reply: "" });
  };

  const handleReply = (data: ReplyForm) => {
    if (selectedMessage) {
      replyMutation.mutate({ id: selectedMessage.id, reply: data.reply });
    }
  };

  const unreadCount = messages.filter(m => !m.read).length;

  if (loadingMessages) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Gelen Mesajlar</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} yeni</Badge>
          )}
        </div>
      </div>

      {messages.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Henüz mesaj yok</h3>
              <p className="text-muted-foreground">
                Katılımcılardan gelen mesajlar burada görünecek.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3 pr-4">
            {messages.map((message) => {
              const participant = getParticipant(message.participantId);
              const initials = participant?.fullName.split(" ").map(n => n[0]).join("").substring(0, 2) || "?";
              
              return (
                <Card 
                  key={message.id}
                  className={`cursor-pointer transition-colors ${!message.read ? "border-primary/50 bg-primary/5" : ""}`}
                  onClick={() => handleOpenMessage(message)}
                  data-testid={`message-card-${message.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{participant?.fullName || "Bilinmeyen"}</span>
                            {!message.read && (
                              <Badge variant="default">Yeni</Badge>
                            )}
                            {message.reply && (
                              <Badge variant="secondary">Yanıtlandı</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm mb-1">{message.subject}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {selectedMessage?.subject}
            </DialogTitle>
            <DialogDescription>
              {getParticipant(selectedMessage?.participantId || "")?.fullName || "Bilinmeyen"} -{" "}
              {selectedMessage && new Date(selectedMessage.createdAt).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{selectedMessage?.content}</p>
            </div>

            {selectedMessage?.reply ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-chart-2" />
                  <span>
                    Yanıtlandı - {selectedMessage.repliedAt && new Date(selectedMessage.repliedAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <div className="bg-primary/5 border-l-4 border-primary rounded-r-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedMessage.reply}</p>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleReply)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="reply"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yanıtınız</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Yanıtınızı yazın..." 
                            className="min-h-[100px]"
                            data-testid="textarea-reply"
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
                    disabled={replyMutation.isPending}
                    data-testid="button-send-reply"
                  >
                    {replyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <Reply className="mr-2 h-4 w-4" />
                        Yanıtla
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
