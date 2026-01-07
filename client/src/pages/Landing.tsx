import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Users, GraduationCap, Shield, BookOpen, Cpu, Network, Database, Zap, ArrowRight, CheckCircle, BarChart3, Video } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
        
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        
        <div className="absolute top-20 left-10 text-blue-400/20 animate-bounce" style={{ animationDuration: '3s' }}>
          <Cpu className="w-12 h-12" />
        </div>
        <div className="absolute top-40 right-20 text-cyan-400/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
          <Network className="w-16 h-16" />
        </div>
        <div className="absolute bottom-32 left-20 text-indigo-400/20 animate-bounce" style={{ animationDuration: '5s', animationDelay: '0.5s' }}>
          <Database className="w-10 h-10" />
        </div>
        <div className="absolute bottom-40 right-32 text-blue-400/20 animate-pulse" style={{ animationDuration: '2s' }}>
          <Zap className="w-14 h-14" />
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl blur-xl opacity-40" />
              <div className="relative p-5 bg-gradient-to-br from-blue-600/90 to-cyan-600/90 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl">
                <GraduationCap className="h-14 w-14 text-white" />
              </div>
            </div>
          </div>
          
          <div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tighter">
              <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent drop-shadow-2xl" style={{ fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif", letterSpacing: "-0.04em" }}>
                TEKNOKRAT
              </span>
            </h1>
            <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-blue-400 to-transparent mb-6" />
          </div>
          
          <p className="text-xl md:text-2xl font-light text-blue-100/90 tracking-wide mb-3">
            Kurumsal Egitim ve Gelisim Sistemi
          </p>
          <p className="text-sm text-blue-300/70 font-light tracking-widest uppercase mb-8">
            Enterprise Learning Management Platform
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-xs text-blue-200/60 mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>Video Egitim</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Ilerleme Takibi</span>
            </div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>Canli Izleme</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 max-w-5xl w-full px-4" data-testid="panel-selection-container">
          <div className="flex-1 transition-transform duration-300 hover:scale-[1.02] hover:-translate-y-1" data-testid="admin-panel-wrapper">
            <Card 
              className="h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 cursor-pointer group overflow-visible shadow-xl shadow-blue-500/10"
              onClick={() => navigate("/admin/login")}
              data-testid="card-admin-panel"
            >
              <CardHeader className="text-center pb-4 pt-8">
                <div className="mx-auto mb-5 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative p-4 bg-gradient-to-br from-indigo-500/90 to-blue-600/90 rounded-2xl border border-white/20">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white tracking-tight">
                  Yonetim Paneli
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-8">
                <CardDescription className="text-blue-100/80 text-center text-sm mb-6">
                  Egitim atama, kisi yonetimi ve raporlama
                </CardDescription>
                <ul className="space-y-3 text-sm text-blue-100/70">
                  <li className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <Users className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>Katilimci yonetimi</span>
                  </li>
                  <li className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <BookOpen className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>Egitim atama ve takip</span>
                  </li>
                  <li className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <BarChart3 className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>Detayli raporlama</span>
                  </li>
                </ul>
                <div className="mt-6 flex items-center justify-center gap-2 text-blue-300 group-hover:text-cyan-300 transition-colors text-sm font-medium">
                  <span>Giris Yap</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 transition-transform duration-300 hover:scale-[1.02] hover:-translate-y-1" data-testid="participant-panel-wrapper">
            <Card 
              className="h-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 cursor-pointer group overflow-visible shadow-xl shadow-cyan-500/10"
              onClick={() => navigate("/participant/login")}
              data-testid="card-participant-panel"
            >
              <CardHeader className="text-center pb-4 pt-8">
                <div className="mx-auto mb-5 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity" />
                  <div className="relative p-4 bg-gradient-to-br from-cyan-500/90 to-teal-600/90 rounded-2xl border border-white/20">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-white tracking-tight">
                  Katilimci Paneli
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-8">
                <CardDescription className="text-blue-100/80 text-center text-sm mb-6">
                  Egitim izleme ve gelisim takibi
                </CardDescription>
                <ul className="space-y-3 text-sm text-blue-100/70">
                  <li className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <Video className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>Atanan egitimleri izle</span>
                  </li>
                  <li className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <CheckCircle className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>Ilerleme durumunu takip et</span>
                  </li>
                  <li className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                    <Users className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                    <span>Yonetimle iletisim</span>
                  </li>
                </ul>
                <div className="mt-6 flex items-center justify-center gap-2 text-blue-300 group-hover:text-cyan-300 transition-colors text-sm font-medium">
                  <span>Giris Yap</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="flex items-center justify-center gap-4 text-xs text-blue-300/40 mb-3">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-blue-400/20" />
            <span>TEKNOKRAT LMS</span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-blue-400/20" />
          </div>
          <p className="text-xs text-blue-400/30">
            Enterprise Learning Platform v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
