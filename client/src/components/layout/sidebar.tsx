import { Music, Layers, Sliders, Bot, History } from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { icon: Music, label: "Projects", active: true },
    { icon: Layers, label: "Stems", active: false },
    { icon: Sliders, label: "Mixer", active: false },
    { icon: Bot, label: "AI Assistant", active: false },
    { icon: History, label: "Mix History", active: false },
  ];

  return (
    <div className="w-72 surface-glass border-r border-[var(--border-strong)] flex flex-col">
      <div className="p-8 border-b border-[var(--border)]">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl flex items-center justify-center">
              <Music className="text-[var(--background)]" size={20} />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--accent-tertiary)] rounded-full pulse-ring"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-display-md">AUDIO</h1>
            <p className="text-sm text-[var(--foreground-muted)] font-mono tracking-wide">STUDIO PRO</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-6 space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`group w-full flex items-center space-x-4 px-4 py-4 rounded-xl transition-all duration-200 ${
                item.active
                  ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-[var(--background)] shadow-lg glow-primary"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-elevated)] card-elevated"
              }`}
            >
              <div className={`p-2 rounded-lg transition-colors ${
                item.active 
                  ? "bg-white/20" 
                  : "bg-[var(--background-tertiary)] group-hover:bg-[var(--accent-primary)]/20"
              }`}>
                <Icon size={18} />
              </div>
              <span className={`font-medium tracking-tight ${item.active ? "font-semibold" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-6 border-t border-[var(--border)]">
        <div className="card-elevated p-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-tertiary)] to-[var(--accent-secondary)] rounded-xl flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--background)]">AS</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--accent-tertiary)] rounded-full border-2 border-[var(--background-secondary)]"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--foreground)] truncate">Audio Studio</p>
              <p className="text-xs text-[var(--foreground-muted)] font-mono">ENTERPRISE</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
