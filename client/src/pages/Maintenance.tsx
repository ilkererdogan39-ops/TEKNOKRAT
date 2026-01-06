import { GraduationCap, Wrench } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="text-center max-w-md">
        <div className="flex justify-center mb-8">
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
            <GraduationCap className="h-20 w-20 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          TEKNOKRAT
        </h1>
        
        <div className="flex items-center justify-center gap-3 mb-6">
          <Wrench className="h-6 w-6 text-yellow-400" />
          <h2 className="text-xl md:text-2xl font-semibold text-white">
            Sistemde Bakım Çalışması Yapılmaktadır
          </h2>
        </div>
        
        <p className="text-lg text-blue-100 dark:text-slate-300 mb-8">
          Sistemimiz şu anda bakım modunda. Lütfen daha sonra tekrar deneyiniz.
        </p>
        
        <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl">
          <p className="text-sm text-blue-200 dark:text-slate-400">
            Herhangi bir sorunuz için yöneticinizle iletişime geçebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
