import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Upload, Trash2, Pencil, Search, Users, Loader2, AlertTriangle, KeyRound, Check, X } from "lucide-react";
import { insertParticipantSchema, type SafeParticipant, type InsertParticipant } from "@shared/schema";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function UserManagement() {
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SafeParticipant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [resetPasswordUser, setResetPasswordUser] = useState<SafeParticipant | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: participants = [], isLoading } = useQuery<SafeParticipant[]>({
    queryKey: ["/api/participants"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertParticipant) => {
      const res = await apiRequest("POST", "/api/participants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      setIsAddOpen(false);
      toast({ title: "Katılımcı Eklendi", description: "Yeni katılımcı başarıyla eklendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Katılımcı eklenirken bir hata oluştu.", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertParticipant> }) => {
      const res = await apiRequest("PATCH", `/api/participants/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      setEditingUser(null);
      toast({ title: "Güncellendi", description: "Katılımcı bilgileri güncellendi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Güncelleme sırasında bir hata oluştu.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/participants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      toast({ title: "Silindi", description: "Katılımcı başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Silme işlemi sırasında bir hata oluştu.", variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/reset");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trainings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] });
      toast({ title: "Sıfırlandı", description: "Tüm veriler başarıyla silindi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Sıfırlama sırasında bir hata oluştu.", variant: "destructive" });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ participantId, newPassword }: { participantId: string; newPassword: string }) => {
      const res = await apiRequest("POST", "/api/participants/reset-password", { participantId, newPassword });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      setResetPasswordUser(null);
      setNewPassword("");
      toast({ title: "Sifre Sifirlandi", description: "Katilimci sifresi basariyla sifirlandi." });
    },
    onError: () => {
      toast({ title: "Hata", description: "Sifre sifirlanamadi.", variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      // Try to read with UTF-8 first, then fall back to Windows-1254 for Turkish Excel
      const readFileWithEncoding = (encoding: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file, encoding);
        });
      };
      
      // Read as UTF-8 first
      let text = await readFileWithEncoding("UTF-8");
      
      // Check for common Turkish characters being garbled (indicates wrong encoding)
      // If we see replacement characters or garbled text, try Windows-1254
      const hasGarbledChars = /[\ufffd]|Ã¼|Ã¶|Ã§|ÅŸ|Ä±|ÄŸ|Ã–|Ãœ|Ã‡|Å |Ä°|Äž/.test(text);
      
      if (hasGarbledChars) {
        // Try Windows-1254 (Turkish ANSI) encoding
        text = await readFileWithEncoding("windows-1254");
      }
      
      // Remove BOM if present
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
      }
      
      const res = await apiRequest("POST", "/api/participants/import", { csv: text });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/participants"] });
      toast({ 
        title: "İçe Aktarıldı", 
        description: `${data.imported} katılımcı başarıyla eklendi.` 
      });
    },
    onError: () => {
      toast({ title: "Hata", description: "CSV içe aktarma başarısız.", variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importMutation.mutate(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Katılımcı ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-users"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-user">
                <Plus className="h-4 w-4 mr-2" />
                Yeni Ekle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Yeni Katılımcı Ekle</DialogTitle>
                <DialogDescription>
                  Katılımcı bilgilerini doldurun.
                </DialogDescription>
              </DialogHeader>
              <ParticipantForm 
                onSubmit={(data) => addMutation.mutate(data)} 
                isLoading={addMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
            data-testid="button-import-csv"
          >
            {importMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            CSV İçe Aktar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive/50" data-testid="button-reset-all">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Sıfırla
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tüm Verileri Sil?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem tüm katılımcıları, eğitimleri ve atamaları kalıcı olarak silecektir. Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>İptal</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => resetMutation.mutate()}
                  className="bg-destructive text-destructive-foreground"
                  data-testid="button-confirm-reset"
                >
                  Evet, Sıfırla
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Henüz katılımcı yok</h3>
          <p className="text-muted-foreground mb-4">
            Yeni katılımcı ekleyerek başlayın.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Sicil No</TableHead>
                  <TableHead className="font-semibold">Ad Soyad</TableHead>
                  <TableHead className="font-semibold hidden md:table-cell">Departman</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">E-Posta</TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell">Şifre</TableHead>
                  <TableHead className="font-semibold text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => (
                  <TableRow key={participant.id} data-testid={`row-user-${participant.id}`}>
                    <TableCell className="font-medium">{participant.employeeId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={`${getAvatarColor(participant.fullName)} text-white text-xs`}>
                            {getInitials(participant.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{participant.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{participant.department}</TableCell>
                    <TableCell className="hidden lg:table-cell">{participant.email}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        {participant.hasPassword ? (
                          <span className="flex items-center gap-1 text-chart-2">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Ayarlandi</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <X className="h-4 w-4" />
                            <span className="text-sm">Ayarlanmadi</span>
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResetPasswordUser(participant)}
                          title="Sifre Sifirla"
                          data-testid={`button-reset-password-${participant.id}`}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingUser(participant)}
                          data-testid={`button-edit-${participant.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              data-testid={`button-delete-${participant.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Katılımcıyı Sil</AlertDialogTitle>
                              <AlertDialogDescription>
                                {participant.fullName} isimli katılımcıyı silmek istediğinize emin misiniz?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteMutation.mutate(participant.id)}
                                className="bg-destructive text-destructive-foreground"
                              >
                                Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Katilimciyi Duzenle</DialogTitle>
            <DialogDescription>
              Katilimci bilgilerini guncelleyin.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <ParticipantForm 
              defaultValues={editingUser}
              onSubmit={(data) => updateMutation.mutate({ id: editingUser.id, data })} 
              isLoading={updateMutation.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && setResetPasswordUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Sifre Sifirla
            </DialogTitle>
            <DialogDescription>
              {resetPasswordUser?.fullName} icin yeni sifre belirleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Yeni Sifre</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="En az 4 karakter"
                data-testid="input-new-password"
              />
            </div>
            <Button
              className="w-full"
              disabled={newPassword.length < 4 || resetPasswordMutation.isPending}
              onClick={() => {
                if (resetPasswordUser) {
                  resetPasswordMutation.mutate({
                    participantId: resetPasswordUser.id,
                    newPassword,
                  });
                }
              }}
              data-testid="button-confirm-reset-password"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sifirlaniyor...
                </>
              ) : (
                "Sifreyi Sifirla"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const editParticipantSchema = insertParticipantSchema.extend({
  password: z.string().refine(
    (val) => val === "" || val.length >= 4,
    { message: "Şifre en az 4 karakter olmalı" }
  ),
});

type EditParticipant = z.infer<typeof editParticipantSchema>;

function ParticipantForm({ 
  defaultValues, 
  onSubmit, 
  isLoading,
  isEdit = false
}: { 
  defaultValues?: Partial<InsertParticipant>;
  onSubmit: (data: InsertParticipant | EditParticipant) => void;
  isLoading: boolean;
  isEdit?: boolean;
}) {
  const schema = isEdit ? editParticipantSchema : insertParticipantSchema;
  
  const form = useForm<InsertParticipant | EditParticipant>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: defaultValues?.employeeId || "",
      fullName: defaultValues?.fullName || "",
      department: defaultValues?.department || "",
      email: defaultValues?.email || "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sicil No</FormLabel>
              <FormControl>
                <Input placeholder="Örn: 12345" data-testid="input-employee-id" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ad Soyad</FormLabel>
              <FormControl>
                <Input placeholder="Örn: Ahmet Yılmaz" data-testid="input-full-name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Departman</FormLabel>
              <FormControl>
                <Input placeholder="Örn: İnsan Kaynakları" data-testid="input-department" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-Posta</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Örn: ahmet@sirket.com" data-testid="input-email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Şifre
                {isEdit && <span className="text-muted-foreground ml-1">(boş bırakılırsa değişmez)</span>}
              </FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={isEdit ? "Yeni sifre (istege bagli)" : "Sifre giriniz"} 
                  data-testid="input-password" 
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-submit-user">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? "Güncelleniyor..." : "Ekleniyor..."}
            </>
          ) : (
            isEdit ? "Güncelle" : "Ekle"
          )}
        </Button>
      </form>
    </Form>
  );
}
