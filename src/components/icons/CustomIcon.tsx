import { LucideProps } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface CustomIconProps extends Omit<LucideProps, 'size'> {
  src: string;
}

export const CustomIcon = ({ src, className, style, color, ...props }: CustomIconProps) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Extract color from style prop if color is not directly provided
  const iconColor = color || (style as any)?.color;
  
  // Extract existing filter from style if present
  const existingFilter = style?.filter as string | undefined;
  
  // Build filter string
  let filterString = '';
  
  if (isDarkMode) {
    // In dark mode: invert to white outline with transparent fill
    const inversionFilter = 'brightness(0) invert(1)';
    
    if (existingFilter && existingFilter.includes('drop-shadow')) {
      filterString = `${inversionFilter} ${existingFilter}`;
    } else if (iconColor) {
      filterString = `${inversionFilter} drop-shadow(0 2px 4px ${iconColor}60)`;
    } else {
      filterString = inversionFilter;
    }
  } else {
    // Light mode: keep original colors
    if (existingFilter) {
      filterString = existingFilter;
    } else if (iconColor) {
      filterString = `drop-shadow(0 2px 4px ${iconColor}60)`;
    }
  }
  
  return (
    <img
      src={src}
      alt=""
      className={className}
      style={{
        ...style,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        filter: filterString || undefined
      }}
      {...props}
    />
  );
};

