"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Info,
  UserRoundCheck,
  X,
} from "lucide-react";

export type ToastTone =
  | "success"
  | "error"
  | "info"
  | "absent"
  | "late"
  | "present"
  | "leave";

export interface ToastInput {
  tone: ToastTone;
  title: string;
  description?: string;
  duration?: number;
  soundContext?: AudioContext | null;
}

interface ToastItem extends Omit<ToastInput, "soundContext"> {
  id: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_STYLES: Record<ToastTone, {
  icon: typeof CheckCircle2;
  iconClass: string;
  borderClass: string;
  surfaceClass: string;
  titleClass: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    borderClass: "border-l-emerald-600",
    surfaceClass: "border-emerald-200 bg-emerald-50/95 dark:border-emerald-900/70 dark:bg-emerald-950/90",
    titleClass: "text-emerald-950 dark:text-emerald-100",
  },
  present: {
    icon: UserRoundCheck,
    iconClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    borderClass: "border-l-emerald-600",
    surfaceClass: "border-emerald-200 bg-emerald-50/95 dark:border-emerald-900/70 dark:bg-emerald-950/90",
    titleClass: "text-emerald-950 dark:text-emerald-100",
  },
  absent: {
    icon: AlertCircle,
    iconClass: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    borderClass: "border-l-red-600",
    surfaceClass: "border-red-200 bg-red-50/95 dark:border-red-900/70 dark:bg-red-950/90",
    titleClass: "text-red-950 dark:text-red-100",
  },
  late: {
    icon: Clock3,
    iconClass: "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
    borderClass: "border-l-amber-500",
    surfaceClass: "border-amber-200 bg-amber-50/95 dark:border-amber-900/70 dark:bg-amber-950/90",
    titleClass: "text-amber-950 dark:text-amber-100",
  },
  leave: {
    icon: Info,
    iconClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    borderClass: "border-l-blue-600",
    surfaceClass: "border-blue-200 bg-blue-50/95 dark:border-blue-900/70 dark:bg-blue-950/90",
    titleClass: "text-blue-950 dark:text-blue-100",
  },
  error: {
    icon: AlertCircle,
    iconClass: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
    borderClass: "border-l-red-600",
    surfaceClass: "border-red-200 bg-red-50/95 dark:border-red-900/70 dark:bg-red-950/90",
    titleClass: "text-red-950 dark:text-red-100",
  },
  info: {
    icon: Info,
    iconClass: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
    borderClass: "border-l-[#9E1B32]",
    surfaceClass: "border-neutral-200 bg-neutral-50/95 dark:border-neutral-700 dark:bg-neutral-900/95",
    titleClass: "text-neutral-950 dark:text-neutral-100",
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const lastSoundAt = useRef(0);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = ++nextId.current;
    const { soundContext, duration = 4200, ...visibleToast } = input;
    const now = Date.now();
    const isSuccessTone = input.tone !== "error" && input.tone !== "info";
    if (soundContext) {
      lastSoundAt.current = now;
      playSuccessTone(soundContext);
    } else if (isSuccessTone && now - lastSoundAt.current >= 1200) {
      lastSoundAt.current = now;
      const context = createSuccessAudioContext();
      if (context) playSuccessTone(context);
    }

    setItems((current) => [...current.slice(-2), { ...visibleToast, id }]);
    timers.current.set(id, setTimeout(() => dismiss(id), duration));
  }, [dismiss]);

  useEffect(() => () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-end gap-2 px-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[min(25rem,calc(100vw-2.5rem))] sm:px-0" role="region" aria-label="Notifications">
        {items.map((item) => {
          const style = TONE_STYLES[item.tone];
          const Icon = style.icon;
          const isError = item.tone === "error";
          return (
            <div
              key={item.id}
              role={isError ? "alert" : "status"}
              aria-live={isError ? "assertive" : "polite"}
              className={`toast-enter pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-l-4 p-3 shadow-lg shadow-neutral-900/10 ring-1 ring-black/[0.03] ${style.borderClass} ${style.surfaceClass} dark:shadow-black/30 dark:ring-white/[0.04]`}
            >
              <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.iconClass}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={`text-sm font-semibold leading-5 ${style.titleClass}`}>{item.title}</p>
                {item.description && <p className="mt-0.5 text-xs leading-4 text-neutral-600 dark:text-neutral-300">{item.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(item.id)}
                className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E1B32] dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

export function createSuccessAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  try {
    const context = new AudioContext();
    void context.resume();
    return context;
  } catch {
    return null;
  }
}

function playSuccessTone(context: AudioContext) {
  try {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, start);
    oscillator.frequency.setValueAtTime(987.77, start + 0.075);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.032, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.21);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => void context.close();
    oscillator.start(start);
    oscillator.stop(start + 0.23);
  } catch {
    void context.close();
  }
}
