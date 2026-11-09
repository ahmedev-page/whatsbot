import { Fragment, type ComponentPropsWithoutRef, type ReactNode } from 'react';

// Drop-in replacement for the small part of framer-motion the landing page used.
//
// Why: the page declared `initial={{ opacity: 0 }}` / `whileInView` on whole
// sections and swapped content through `AnimatePresence mode="wait"`. All of
// that depends on JS animation frames and IntersectionObserver firing. In
// background tabs, in-app browsers and low-end phones they sometimes never do —
// leaving sections permanently invisible (a "white page") or a tab panel that
// never mounts after a click (content that "disappears", buttons that "do
// nothing"). Here content is always rendered immediately; a CSS fade (which
// is visible by default if it never runs) is the only motion left.

const MOTION_PROPS = [
  'initial', 'animate', 'exit', 'transition', 'whileInView', 'whileHover', 'whileTap',
  'viewport', 'layout', 'layoutId', 'variants', 'custom',
] as const;

type MotionProps<T extends 'div' | 'span'> = ComponentPropsWithoutRef<T> & {
  [K in (typeof MOTION_PROPS)[number]]?: unknown;
};

function createMotionComponent<T extends 'div' | 'span'>(Tag: T) {
  return function MotionLite(props: MotionProps<T>) {
    const rest: Record<string, unknown> = { ...props };
    for (const key of MOTION_PROPS) delete rest[key];
    // Only elements that used to animate in get the (non-blocking) CSS fade.
    if (props.initial !== undefined) {
      rest.className = ['motion-fade', props.className].filter(Boolean).join(' ');
    }
    const Component = Tag as 'div';
    return <Component {...(rest as ComponentPropsWithoutRef<'div'>)} />;
  };
}

export const motion = {
  div: createMotionComponent('div'),
  span: createMotionComponent('span'),
};

export function AnimatePresence({ children }: { children?: ReactNode; mode?: string; initial?: boolean }) {
  return <Fragment>{children}</Fragment>;
}

export function LayoutGroup({ children }: { children?: ReactNode; id?: string }) {
  return <Fragment>{children}</Fragment>;
}
