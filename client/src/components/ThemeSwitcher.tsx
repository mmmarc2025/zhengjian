import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme, STYLE_THEME_NAMES, type StyleTheme } from "@/contexts/ThemeContext";
import { Palette, Moon, Sun } from "lucide-react";

export function ThemeSwitcher() {
  const { styleTheme, setStyleTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {styleTheme === "dark-gradient" ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
          <span className="sr-only">切換風格</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {(Object.keys(STYLE_THEME_NAMES) as StyleTheme[]).map((theme) => (
          <DropdownMenuItem
            key={theme}
            onClick={() => setStyleTheme(theme)}
            className={styleTheme === theme ? "bg-accent" : ""}
          >
            <div className="flex items-center gap-2">
              {theme === "dark-gradient" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Palette className="h-4 w-4" />
              )}
              <span>{STYLE_THEME_NAMES[theme]}</span>
              {styleTheme === theme && (
                <span className="ml-auto text-xs text-muted-foreground">✓</span>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
