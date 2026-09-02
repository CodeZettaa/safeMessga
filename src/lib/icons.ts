import { createElement, type CSSProperties } from 'react';
import {
  BookOpen,
  Briefcase,
  Code,
  GraduationCap,
  Heart,
  Laptop,
  Lightbulb,
  MessageCircle,
  MessageCircleHeart,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

const icons: Record<string, LucideIcon> = {
  code: Code,
  briefcase: Briefcase,
  'graduation-cap': GraduationCap,
  sparkles: Sparkles,
  'message-circle': MessageCircle,
  'message-circle-heart': MessageCircleHeart,
  heart: Heart,
  lightbulb: Lightbulb,
  'book-open': BookOpen,
  laptop: Laptop,
};

export function CategoryIcon({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  return createElement(icons[name] ?? MessageCircle, { className, style });
}
