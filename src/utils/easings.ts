import { cubicBezier } from 'motion';

export const easeInQuad = cubicBezier(0.55, 0.085, 0.68, 0.53);
export const easeInCubic = cubicBezier(0.55, 0.055, 0.675, 0.19);
export const easeInQuart = cubicBezier(0.895, 0.03, 0.685, 0.22);
export const easeInQuint = cubicBezier(0.755, 0.05, 0.855, 0.06);
export const easeInExpo = cubicBezier(0.95, 0.05, 0.795, 0.035);
export const easeInCirc = cubicBezier(0.6, 0.04, 0.98, 0.335);

// if confused, use ease out
export const easeOutQuad = cubicBezier(0.25, 0.46, 0.45, 0.94);
export const easeOutCubic = cubicBezier(0.215, 0.61, 0.355, 1);
export const easeOutQuart = cubicBezier(0.165, 0.84, 0.44, 1);
export const easeOutQuint = cubicBezier(0.23, 1, 0.32, 1);
export const easeOutExpo = cubicBezier(0.19, 1, 0.22, 1);
export const easeOutCirc = cubicBezier(0.075, 0.82, 0.165, 1);

export const easeInOutQuad = cubicBezier(0.455, 0.03, 0.515, 0.955);
export const easeInOutCubic = cubicBezier(0.645, 0.045, 0.355, 1);
export const easeInOutQuart = cubicBezier(0.77, 0, 0.175, 1);
export const easeInOutQuint = cubicBezier(0.86, 0, 0.07, 1);
export const easeInOutExpo = cubicBezier(1, 0, 0, 1);
export const easeInOutCirc = cubicBezier(0.785, 0.135, 0.15, 0.86);
