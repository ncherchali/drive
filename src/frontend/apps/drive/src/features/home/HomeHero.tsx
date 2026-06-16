// Hero de la landing Sahla — esthétique « Nexus » (canvas de points interactif,
// titre à texte rotatif, animations framer-motion) recolorée à l'identité Sahla
// (accent violet, plus de teal/vert) et RENDUE THEME-AWARE : tout passe par les
// tokens DS (bg-background/foreground/border/primary…) → versions claire ET
// sombre automatiques via la classe `.dark`. Logo + navbar s'adaptent au thème.
// Pages Router : "use client" non requis (rendu/hydratation côté client).
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
  type Transition,
  type Target,
  type VariantLabels,
  type AnimationControls,
  type TargetAndTransition,
  type Variants,
} from "framer-motion";
import { useTranslation } from "react-i18next";
import { login, useAuth } from "@/features/auth/Auth";
import { useConfig } from "@/features/config/ConfigProvider";
import { LANGUAGES } from "@/features/layouts/components/header/Header";
import { getDriver } from "@/features/config/Config";
import banner from "@/assets/home/banner.png";
import { cn } from "@/utils/cn";
import { ChevronDown, Globe, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "@/features/theme/ModeToggle";

/* -------------------------------------------------------------------------- */
/* RotatingText — texte à rotation animée (caractère par caractère).          */
/* -------------------------------------------------------------------------- */
interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}
interface RotatingTextProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.span>,
    "children" | "transition" | "initial" | "animate" | "exit"
  > {
  texts: string[];
  transition?: Transition;
  initial?: boolean | Target | VariantLabels;
  animate?: boolean | VariantLabels | AnimationControls | TargetAndTransition;
  exit?: Target | VariantLabels;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: "first" | "last" | "center" | number;
  mainClassName?: string;
  elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      transition = { type: "spring", damping: 25, stiffness: 300 },
      initial = { y: "100%", opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: "-120%", opacity: 0 },
      rotationInterval = 2200,
      staggerDuration = 0.01,
      staggerFrom = "last",
      mainClassName,
      elementLevelClassName,
      ...rest
    },
    ref,
  ) => {
    const [index, setIndex] = useState(0);

    const chars = useMemo(() => {
      const text = texts[index] ?? "";
      // Écritures cursives (arabe, hébreu, persan…) : NE PAS découper en
      // caractères — cela casse les jointures/ligatures. On anime le mot entier.
      if (/[֐-ࣿ]/.test(text)) return [text];
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        try {
          const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
          return Array.from(seg.segment(text), (s) => s.segment);
        } catch {
          return text.split("");
        }
      }
      return text.split("");
    }, [texts, index]);

    const total = chars.length;
    const getDelay = useCallback(
      (i: number) => {
        if (total <= 1 || !staggerDuration) return 0;
        switch (staggerFrom) {
          case "first":
            return i * staggerDuration;
          case "last":
            return (total - 1 - i) * staggerDuration;
          case "center":
            return Math.abs((total - 1) / 2 - i) * staggerDuration;
          default:
            return typeof staggerFrom === "number"
              ? Math.abs(staggerFrom - i) * staggerDuration
              : i * staggerDuration;
        }
      },
      [total, staggerFrom, staggerDuration],
    );

    const next = useCallback(
      () => setIndex((p) => (p === texts.length - 1 ? 0 : p + 1)),
      [texts.length],
    );
    useImperativeHandle(ref, () => ({
      next,
      previous: () => setIndex((p) => (p === 0 ? texts.length - 1 : p - 1)),
      jumpTo: (i: number) =>
        setIndex(Math.max(0, Math.min(i, texts.length - 1))),
      reset: () => setIndex(0),
    }));

    useEffect(() => {
      if (texts.length <= 1) return;
      const id = setInterval(next, rotationInterval);
      return () => clearInterval(id);
    }, [next, rotationInterval, texts.length]);

    return (
      <motion.span
        className={cn(
          "inline-flex flex-wrap whitespace-pre-wrap relative align-bottom",
          mainClassName,
        )}
        {...rest}
        layout
      >
        <span className="sr-only">{texts[index]}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            className="inline-flex flex-row items-baseline relative"
            layout
            aria-hidden="true"
          >
            {chars.map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                initial={initial}
                animate={animate}
                exit={exit}
                transition={{ ...transition, delay: getDelay(i) }}
                className={cn(
                  "inline-block leading-none tracking-tight",
                  elementLevelClassName,
                )}
              >
                {char === " " ? " " : char}
              </motion.span>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    );
  },
);
RotatingText.displayName = "RotatingText";

/* -------------------------------------------------------------------------- */
/* Sélecteur de langue (theme-aware, tokens DS).                              */
/* -------------------------------------------------------------------------- */
const LanguageSwitch: React.FC = () => {
  const { i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const current = (i18n.language || "fr").split("-")[0];
  const currentLabel =
    LANGUAGES.find((l) => l.value.split("-")[0] === current)?.shortLabel ??
    current.toUpperCase();

  const change = (value: string) => {
    i18n.changeLanguage(value).catch(() => undefined);
    if (user) {
      getDriver()
        .updateUser({ language: value, id: user.id })
        .then(() => void refreshUser?.())
        .catch(() => undefined);
    }
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Changer la langue"
          className="flex items-center gap-1 rounded-md px-1.5 py-1 text-sm font-medium text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Globe className="size-4" />
          <span className="uppercase">{currentLabel}</span>
          <ChevronDown className="size-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng.value}
            onSelect={() => change(lng.value)}
          >
            <span className="flex-1">{lng.label}</span>
            {lng.value.split("-")[0] === current && (
              <Check className="ms-auto size-4" aria-hidden />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/* -------------------------------------------------------------------------- */
/* Canvas de points interactif (violet, visible en clair ET sombre).          */
/* -------------------------------------------------------------------------- */
const DOT_RGB = { r: 124, g: 58, b: 237 }; // #7C3AED

const DotCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const gridRef = useRef<Record<string, number[]>>({});
  const sizeRef = useRef({ width: 0, height: 0 });
  const mouseRef = useRef<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  const DOT_SPACING = 25;
  const BASE_OPACITY_MIN = 0.26;
  const BASE_OPACITY_MAX = 0.4;
  const BASE_RADIUS = 1;
  const INTERACTION_RADIUS = 150;
  const INTERACTION_RADIUS_SQ = INTERACTION_RADIUS * INTERACTION_RADIUS;
  const OPACITY_BOOST = 0.6;
  const RADIUS_BOOST = 2.5;
  const GRID_CELL = Math.max(50, Math.floor(INTERACTION_RADIUS / 1.5));

  const onMouseMove = useCallback((e: globalThis.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      mouseRef.current = { x: null, y: null };
      return;
    }
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const createDots = useCallback(() => {
    const { width, height } = sizeRef.current;
    if (!width || !height) return;
    const dots: Dot[] = [];
    const grid: Record<string, number[]> = {};
    const cols = Math.ceil(width / DOT_SPACING);
    const rows = Math.ceil(height / DOT_SPACING);
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * DOT_SPACING + DOT_SPACING / 2;
        const y = j * DOT_SPACING + DOT_SPACING / 2;
        const key = `${Math.floor(x / GRID_CELL)}_${Math.floor(y / GRID_CELL)}`;
        (grid[key] ??= []).push(dots.length);
        const op =
          Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) +
          BASE_OPACITY_MIN;
        dots.push({
          x,
          y,
          targetOpacity: op,
          currentOpacity: op,
          opacitySpeed: Math.random() * 0.005 + 0.002,
          baseRadius: BASE_RADIUS,
          currentRadius: BASE_RADIUS,
        });
      }
    }
    dotsRef.current = dots;
    gridRef.current = grid;
  }, [GRID_CELL]);

  const onResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.parentElement;
    const width = container ? container.clientWidth : window.innerWidth;
    const height = container ? container.clientHeight : window.innerHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      sizeRef.current = { width, height };
      createDots();
    }
  }, [createDots]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const dots = dotsRef.current;
    const grid = gridRef.current;
    const { width, height } = sizeRef.current;
    const { x: mx, y: my } = mouseRef.current;
    if (!ctx || !width || !height) {
      animationFrameId.current = requestAnimationFrame(animate);
      return;
    }
    ctx.clearRect(0, 0, width, height);
    const active = new Set<number>();
    if (mx !== null && my !== null) {
      const cx = Math.floor(mx / GRID_CELL);
      const cy = Math.floor(my / GRID_CELL);
      const r = Math.ceil(INTERACTION_RADIUS / GRID_CELL);
      for (let i = -r; i <= r; i++)
        for (let j = -r; j <= r; j++)
          grid[`${cx + i}_${cy + j}`]?.forEach((d) => active.add(d));
    }
    dots.forEach((dot, idx) => {
      dot.currentOpacity += dot.opacitySpeed;
      if (
        dot.currentOpacity >= dot.targetOpacity ||
        dot.currentOpacity <= BASE_OPACITY_MIN
      ) {
        dot.opacitySpeed = -dot.opacitySpeed;
        dot.currentOpacity = Math.max(
          BASE_OPACITY_MIN,
          Math.min(dot.currentOpacity, BASE_OPACITY_MAX),
        );
        dot.targetOpacity =
          Math.random() * (BASE_OPACITY_MAX - BASE_OPACITY_MIN) +
          BASE_OPACITY_MIN;
      }
      let factor = 0;
      dot.currentRadius = dot.baseRadius;
      if (mx !== null && my !== null && active.has(idx)) {
        const dx = dot.x - mx;
        const dy = dot.y - my;
        const distSq = dx * dx + dy * dy;
        if (distSq < INTERACTION_RADIUS_SQ) {
          factor = Math.max(0, 1 - Math.sqrt(distSq) / INTERACTION_RADIUS);
          factor *= factor;
        }
      }
      const opacity = Math.min(1, dot.currentOpacity + factor * OPACITY_BOOST);
      dot.currentRadius = dot.baseRadius + factor * RADIUS_BOOST;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${DOT_RGB.r}, ${DOT_RGB.g}, ${DOT_RGB.b}, ${opacity.toFixed(3)})`;
      ctx.arc(dot.x, dot.y, dot.currentRadius, 0, Math.PI * 2);
      ctx.fill();
    });
    animationFrameId.current = requestAnimationFrame(animate);
  }, [GRID_CELL, INTERACTION_RADIUS_SQ]);

  useEffect(() => {
    onResize();
    const onLeave = () => (mouseRef.current = { x: null, y: null });
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.documentElement.addEventListener("mouseleave", onLeave);
    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [onResize, onMouseMove, animate]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none opacity-70"
    />
  );
};

interface Dot {
  x: number;
  y: number;
  targetOpacity: number;
  currentOpacity: number;
  opacitySpeed: number;
  baseRadius: number;
  currentRadius: number;
}

/* -------------------------------------------------------------------------- */
/* Hero principal.                                                            */
/* -------------------------------------------------------------------------- */
export const HomeHero: React.FC = () => {
  const { t } = useTranslation();
  const { config } = useConfig();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (val) => setScrolled(val > 10));

  const values = useMemo(() => {
    const v = t("home.values", { returnObjects: true });
    return Array.isArray(v) ? (v as string[]) : ["Storage", "Sharing"];
  }, [t]);

  const contentDelay = 0.3;
  const inc = 0.1;
  const reveal = (i: number): Variants => ({
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: contentDelay + inc * i },
    },
  });

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background pt-[70px] text-foreground">
      <DotCanvas />
      {/* Dégradé de fondu (utilise le token de fond → clair ET sombre). */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, var(--background) 92%), radial-gradient(ellipse at center, transparent 42%, var(--background) 95%)",
        }}
      />

      {/* En-tête (nav minimale, theme-aware). */}
      <header
        className={cn(
          "fixed top-0 z-30 w-full border-b px-6 backdrop-blur-md transition-colors duration-300 md:px-10 lg:px-16",
          scrolled
            ? "border-border/70 bg-background/90 shadow-sm"
            : "border-transparent bg-background/50",
        )}
      >
        <nav className="mx-auto flex h-[70px] max-w-screen-xl items-center justify-between">
          {/* Logo adaptatif : variante claire (texte sombre) en thème clair,
              variante sombre (texte clair) sous `.dark`. */}
          <img
            src="/assets/sahla_logo.svg"
            alt="Sahla"
            className="h-7 w-auto dark:hidden"
            decoding="async"
          />
          <img
            src="/assets/sahla_logo_dark.svg"
            alt="Sahla"
            className="hidden h-7 w-auto dark:block"
            decoding="async"
          />
          <div className="flex items-center gap-3 lg:gap-4">
            <LanguageSwitch />
            <ModeToggle variant="ghost" modal={false} />
            <motion.button
              type="button"
              onClick={() => login()}
              className="rounded-md bg-primary px-4 py-[6px] text-sm font-semibold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {t("home.main_button")}
            </motion.button>
          </div>
        </nav>
      </header>

      {/* Contenu. */}
      <main className="relative z-10 flex flex-grow flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
        <motion.div
          variants={reveal(0)}
          initial="hidden"
          animate="visible"
          className="mb-6"
        >
          <span className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-medium text-primary sm:text-sm">
            {t("home.badge", "Hébergement souverain · La Suite")}
          </span>
        </motion.div>

        <motion.h1
          variants={reveal(1)}
          initial="hidden"
          animate="visible"
          className="mb-3 max-w-4xl text-4xl font-semibold leading-tight text-foreground sm:text-5xl lg:text-[64px]"
        >
          {t("home.title")}
        </motion.h1>

        <motion.div
          variants={reveal(2)}
          initial="hidden"
          animate="visible"
          className="mb-5 flex items-baseline justify-center gap-2 text-2xl font-semibold sm:text-3xl"
        >
          <span className="text-muted-foreground">
            {t("home.rotating_lead", "Pensé pour")}
          </span>
          <span className="inline-block h-[1.25em] overflow-hidden align-bottom">
            <RotatingText
              texts={values}
              mainClassName="mx-1 text-primary"
              staggerFrom="last"
              initial={{ y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "110%", opacity: 0 }}
              staggerDuration={0.01}
              transition={{ type: "spring", damping: 18, stiffness: 250 }}
              rotationInterval={2200}
            />
          </span>
        </motion.div>

        <motion.p
          variants={reveal(3)}
          initial="hidden"
          animate="visible"
          className="mx-auto mb-8 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          {t("home.subtitle")}
        </motion.p>

        <motion.div
          variants={reveal(4)}
          initial="hidden"
          animate="visible"
          className="mb-12 flex flex-col items-center gap-3 sm:flex-row"
        >
          <motion.button
            type="button"
            onClick={() => login()}
            className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-shadow hover:shadow-md"
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            {t("home.main_button")}
          </motion.button>
          <a
            href={config?.FRONTEND_MORE_LINK}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {t("home.more")}
          </a>
        </motion.div>

        <motion.div
          variants={reveal(5)}
          initial="hidden"
          animate="visible"
          className="mx-auto w-full max-w-4xl px-4 sm:px-0"
        >
          <img
            src={banner.src}
            alt=""
            width={1024}
            height={640}
            decoding="async"
            className="mx-auto w-full max-w-2xl rounded-xl border border-border shadow-2xl"
          />
        </motion.div>
      </main>
    </div>
  );
};

export default HomeHero;
