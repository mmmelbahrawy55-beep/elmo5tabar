interface Window {
  gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
  fbq: (command: string, targetId: string, event?: string) => void;
  dataLayer: Record<string, unknown>[];
  __NEXT_DATA__: Record<string, unknown>;
}

declare module '*.svg' {
  const content: React.FC<React.SVGProps<SVGSVGElement>>;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}
