import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft, Loader2 } from "lucide-react";
import { ADMIN_CREDENTIALS } from "@shared/schema";

const loginSchema = z.object({
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(1, "Şifre gerekli"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "admin",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (data.username === ADMIN_CREDENTIALS.username && data.password === ADMIN_CREDENTIALS.password) {
      login({ role: "admin" });
      toast({
        title: "Giriş Başarılı",
        description: "Yönetim paneline yönlendiriliyorsunuz...",
      });
      navigate("/admin/dashboard");
    } else {
      toast({
        title: "Giriş Başarısız",
        description: "Kullanıcı adı veya şifre hatalı.",
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md bg-card">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-primary/10 rounded-xl">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">Yönetici Girişi</CardTitle>
          <CardDescription>
            Yönetim paneline erişmek için giriş yapın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kullanıcı Adı</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Kullanıcı adınızı giriniz" 
                        data-testid="input-admin-username"
                        readOnly
                        className="bg-muted"
                        {...field} 
                      />
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
                    <FormLabel>Şifre</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Şifrenizi giriniz"
                        data-testid="input-admin-password"
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
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Giriş yapılıyor...
                  </>
                ) : (
                  "Giriş Yap"
                )}
              </Button>

              <Button 
                type="button"
                variant="ghost" 
                className="w-full"
                onClick={() => navigate("/")}
                data-testid="button-back-home"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ana Sayfaya Dön
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
