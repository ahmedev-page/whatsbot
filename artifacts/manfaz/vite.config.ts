import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

const port = Number(process.env.PORT || 3000);
const basePath = process.env.BASE_PATH || '/';

function oklchToSrgbCss(match: string, inner: string): string {
  const [coordsPart, alphaPart] = inner.trim().split('/').map((s) => s.trim());
  const parts = coordsPart.split(/\s+/);
  if (parts.length < 3) return match;
  const L = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
  const C = parseFloat(parts[1]);
  const H = (parseFloat(parts[2]) * Math.PI) / 180;
  if (Number.isNaN(L) || Number.isNaN(C) || Number.isNaN(H)) return match;

  const a = C * Math.cos(H);
  const b = C * Math.sin(H);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const toGamma = (c: number) => {
    const clamped = Math.max(0, Math.min(1, c));
    const v =
      clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(v * 255);
  };

  const R = toGamma(rLin);
  const G = toGamma(gLin);
  const B = toGamma(bLin);

  if (alphaPart !== undefined) {
    const alpha = alphaPart.endsWith('%') ? parseFloat(alphaPart) / 100 : parseFloat(alphaPart);
    return `rgba(${R}, ${G}, ${B}, ${Number.isNaN(alpha) ? 1 : alpha})`;
  }
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(R)}${hex(G)}${hex(B)}`;
}

function sanitizeCssColors(css: string): string {
  return css
    .replace(/oklch\(([^)]+)\)/g, oklchToSrgbCss)
    .replace(/color-mix\(in oklab,/g, 'color-mix(in srgb,')
    .replace(/\s+in\s+oklab/g, '');
}

function legacyCssColorCompat(): Plugin {
  return {
    name: 'legacy-css-color-compat',
    enforce: 'post',
    transform(code, id) {
      if (id.includes('.css') || code.includes('oklch(') || code.includes('in oklab')) {
        return {
          code: sanitizeCssColors(code),
          map: null,
        };
      }
      return null;
    },
    generateBundle(_, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'asset' && file.fileName.endsWith('.css') && typeof file.source === 'string') {
          file.source = sanitizeCssColors(file.source);
        }
      }
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    legacyCssColorCompat(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
