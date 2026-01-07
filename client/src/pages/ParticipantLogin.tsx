import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Users, ArrowLeft, Loader2, ArrowRight, KeyRound, CheckCircle } from "lucide-react";
import type { SafeParticipant } from "@shared/schema";

const SAVED_CREDENTIALS_KEY = "lms_participant_credentials";

const identifySchema = z.object({
  employeeId: z.string().min(1, "Sicil numarası gerekli"),
  email: z.string().email("Geçerli bir e-posta giriniz"),
});

const passwordSchema = z.object({
  password: z.string().min(4, "Şifre en az 4 karakter olmalı"),
  confirmPassword: z.string().min(1, "Şifre tekrarı gerekli"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  password: z.string().min(1, "Şifre gerekli"),
});

type IdentifyForm = z.infer<typeof identifySchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type LoginForm = z.infer<typeof loginSchema>;

type Step = "identify" | "set-password" | "login" | "checking";

export default function ParticipantLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("checking");
  const [participantInfo, setParticipantInfo] = useState<{
    participantId: string;
    fullName: string;
    employeeId: string;
    email: string;
  } | null>(null);

  const { data: systemStatus } = useQuery<{ maintenanceMode: boolean }>({
    queryKey: ["/api/system/status"],
  });

  useEffect(() => {
    if (systemStatus?.maintenanceMode) {
      navigate("/maintenance");
    }
  }, [systemStatus?.maintenanceMode, navigate]);

  const identifyForm = useForm<IdentifyForm>({
    resolver: zodResolver(identifySchema),
    defaultValues: { employeeId: "", email: "" },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { password: "" },
  });

  // Check for saved credentials on mount
  useEffect(() => {
    const checkSavedCredentials = async () => {
      try {
        const saved = localStorage.getItem(SAVED_CREDENTIALS_KEY);
        if (saved) {
          const { employeeId, email } = JSON.parse(saved);
          const response = await apiRequest("POST", "/api/participants/identify", { employeeId, email });
          
          if (!response.ok) {
            localStorage.removeItem(SAVED_CREDENTIALS_KEY);
            setStep("identify");
            return;
          }
          
          const result = await response.json();
          
          if (result.hasPassword) {
            setParticipantInfo({
              participantId: result.participantId,
              fullName: result.fullName,
              employeeId,
              email,
            });
            setStep("login");
            return;
          }
        }
      } catch {
        localStorage.removeItem(SAVED_CREDENTIALS_KEY);
      }
      setStep("identify");
    };
    
    checkSavedCredentials();
  }, []);

  const saveCredentials = (employeeId: string, email: string) => {
    localStorage.setItem(SAVED_CREDENTIALS_KEY, JSON.stringify({ employeeId, email }));
  };

  const clearSavedCredentials = () => {
    localStorage.removeItem(SAVED_CREDENTIALS_KEY);
  };

  const onIdentify = async (data: IdentifyForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/participants/identify", data);
      const result = await response.json();
      
      setParticipantInfo({
        participantId: result.participantId,
        fullName: result.fullName,
        employeeId: data.employeeId,
        email: data.email,
      });
      
      if (result.hasPassword) {
        setStep("login");
      } else {
        setStep("set-password");
      }
    } catch (error) {
      toast({
        title: "Katılımcı Bulunamadı",
        description: "Sicil numarası veya e-posta hatalı.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const onSetPassword = async (data: PasswordForm) => {
    if (!participantInfo) return;
    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/participants/set-password", {
        participantId: participantInfo.participantId,
        password: data.password,
      });
      
      const loginResponse = await apiRequest("POST", "/api/participants/login", {
        employeeId: participantInfo.employeeId,
        email: participantInfo.email,
        password: data.password,
      });
      const participant: SafeParticipant = await loginResponse.json();
      
      saveCredentials(participantInfo.employeeId, participantInfo.email);
      login({ role: "participant", participantId: participant.id }, participant);
      toast({
        title: "Şifre Belirlendi",
        description: `Hoş geldiniz, ${participant.fullName}!`,
      });
      navigate("/participant/dashboard");
    } catch (error) {
      toast({
        title: "Hata",
        description: "Şifre belirlenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const onLogin = async (data: LoginForm) => {
    if (!participantInfo) return;
    setIsLoading(true);
    
    try {
      const response = await apiRequest("POST", "/api/participants/login", {
        employeeId: participantInfo.employeeId,
        email: participantInfo.email,
        password: data.password,
      });
      const participant: SafeParticipant = await response.json();
      
      saveCredentials(participantInfo.employeeId, participantInfo.email);
      login({ role: "participant", participantId: participant.id }, participant);
      toast({
        title: "Giriş Başarılı",
        description: `Hoş geldiniz, ${participant.fullName}!`,
      });
      navigate("/participant/dashboard");
    } catch (error) {
      toast({
        title: "Giriş Başarısız",
        description: "Şifre hatalı.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const resetToIdentify = () => {
    clearSavedCredentials();
    setStep("identify");
    setParticipantInfo(null);
    passwordForm.reset();
    loginForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-950 to-slate-900 flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
      
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md bg-slate-800/90 backdrop-blur-sm border-slate-700/50 shadow-2xl relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-cyan-500/20 rounded-xl">
            {step === "checking" && <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />}
            {step === "identify" && <Users className="h-8 w-8 text-cyan-400" />}
            {step === "set-password" && <KeyRound className="h-8 w-8 text-cyan-400" />}
            {step === "login" && <CheckCircle className="h-8 w-8 text-cyan-400" />}
          </div>
          <CardTitle className="text-2xl font-semibold text-white">
            {step === "checking" && "Kontrol Ediliyor..."}
            {step === "identify" && "Katılımcı Girişi"}
            {step === "set-password" && "Şifre Belirleme"}
            {step === "login" && "Hoş Geldiniz"}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {step === "checking" && "Lütfen bekleyin..."}
            {step === "identify" && "Sicil numaranız ve e-posta adresinizi giriniz"}
            {step === "set-password" && `${participantInfo?.fullName}, ilk girişiniz için bir şifre belirleyin`}
            {step === "login" && `${participantInfo?.fullName}, şifrenizi giriniz`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "identify" && (
            <Form {...identifyForm}>
              <form onSubmit={identifyForm.handleSubmit(onIdentify)} className="space-y-6">
                <FormField
                  control={identifyForm.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Sicil Numarası</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Sicil numaranızı giriniz" 
                          data-testid="input-employee-id"
                          className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={identifyForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">E-Posta</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="E-posta adresinizi giriniz" 
                          data-testid="input-participant-email"
                          className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
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
                  data-testid="button-identify"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kontrol ediliyor...
                    </>
                  ) : (
                    <>
                      Devam Et
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full text-slate-300 hover:text-white"
                  onClick={() => navigate("/")}
                  data-testid="button-back-home"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Ana Sayfaya Dön
                </Button>
              </form>
            </Form>
          )}

          {step === "set-password" && (
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onSetPassword)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Yeni Şifre</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="En az 4 karakter"
                          data-testid="input-new-password"
                          className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
                          {...field} 
                        />
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
                      <FormLabel className="text-slate-200">Şifre Tekrar</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Şifrenizi tekrar giriniz"
                          data-testid="input-confirm-password"
                          className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
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
                  data-testid="button-set-password"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      Şifreyi Belirle ve Giriş Yap
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full text-slate-300 hover:text-white"
                  onClick={resetToIdentify}
                  data-testid="button-back-identify"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Geri Dön
                </Button>
              </form>
            </Form>
          )}

          {step === "login" && (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-200">Şifre</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Şifrenizi giriniz"
                          data-testid="input-participant-password"
                          className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-400"
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
                  data-testid="button-participant-login"
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
                  className="w-full text-slate-300 hover:text-white"
                  onClick={resetToIdentify}
                  data-testid="button-back-identify"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Farklı Hesapla Giriş Yap
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Footer Attribution */}
      <div className="absolute bottom-4 left-4 z-10">
        <p 
          className="text-xs text-slate-300/60 leading-relaxed"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif", fontStyle: "italic" }}
          data-testid="text-system-architect"
        >
          Sistem Mimarı: Eğitmen &amp; AI Teknolojileri Mentoru İ.ERDOĞAN
          <br />
          <span className="text-slate-400/50">
            İletişim: gr_egitim@aydinli.com.tr &amp; ilker.erdogan@aydinli.com.tr
          </span>
        </p>
      </div>
    </div>
  );
}
