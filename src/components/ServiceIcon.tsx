import {
  Globe,
  Smartphone,
  Layers,
  ShoppingBag,
  Cpu,
  Wrench,
  Code2,
  ShieldCheck,
} from 'lucide-react';
import type { ServiceIconKey } from '../types';

export function ServiceIcon({
  icon,
  className = 'w-5 h-5 text-[#2878FF]',
}: {
  icon: ServiceIconKey;
  className?: string;
}) {
  switch (icon) {
    case 'globe':
      return <Globe className={className} />;
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'layers':
      return <Layers className={className} />;
    case 'shopping-bag':
      return <ShoppingBag className={className} />;
    case 'cpu':
      return <Cpu className={className} />;
    case 'wrench':
      return <Wrench className={className} />;
    case 'code':
      return <Code2 className={className} />;
    case 'shield':
      return <ShieldCheck className={className} />;
    default:
      return <Globe className={className} />;
  }
}
