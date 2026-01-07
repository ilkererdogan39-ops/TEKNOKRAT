import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Users, GraduationCap, Shield, BookOpen } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <GraduationCap className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-3 tracking-tight">
            <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent drop-shadow-lg" style={{ fontFamily: "'Arial Black', 'Helvetica Neue', sans-serif", letterSpacing: "-0.03em" }}>
              TEKNOKRAT
            </span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-blue-100 tracking-wide mb-2">
            Kurumsal Eğitim ve Gelişim Sistemi
          </p>
          <p className="text-sm text-blue-200 dark:text-slate-400 italic">
            Geleceği Şekillendiren Eğitim Platformu
          </p>
          <p className="text-lg text-blue-100 dark:text-slate-300 max-w-2xl mx-auto mt-4">
            Lütfen devam etmek için bir panel seçiniz.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full px-4">
          <Card 
            className="flex-1 bg-white/10 dark:bg-white/5 backdrop-blur-md border-white/20 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-white/20 dark:hover:bg-white/10 group"
            onClick={() => navigate("/admin/login")}
            data-testid="card-admin-panel"
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-white">
                Yönetim Paneli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-100 dark:text-slate-300 text-center text-base">
                Eğitim atama, kişi yönetimi ve raporlama.
              </CardDescription>
              <ul className="mt-6 space-y-3 text-sm text-blue-100 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Katılımcı yönetimi</span>
                </li>
                <li className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Eğitim atama ve takip</span>
                </li>
                <li className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Detaylı raporlama</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card 
            className="flex-1 bg-white/10 dark:bg-white/5 backdrop-blur-md border-white/20 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:bg-white/20 dark:hover:bg-white/10 group"
            onClick={() => navigate("/participant/login")}
            data-testid="card-participant-panel"
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                <Users className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl font-semibold text-white">
                Katılımcı Paneli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-100 dark:text-slate-300 text-center text-base">
                Eğitim izleme ve gelişim takibi.
              </CardDescription>
              <ul className="mt-6 space-y-3 text-sm text-blue-100 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Atanan eğitimleri görüntüle</span>
                </li>
                <li className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span>Video eğitimleri izle</span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>İlerleme takibi</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <p className="mt-12 text-sm text-blue-200 dark:text-slate-400">
          LMS Platformu v1.0
        </p>
      </div>
    </div>
  );
}
