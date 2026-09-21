export const typography = {
  // ─── Display ───
  display: { fontSize: 44, fontWeight: '800' as const, letterSpacing: -1.2 },
  h1: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.8 },
  h2: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.4 },
  h3: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.2 },

  // ─── Body ───
  bodyLarge: { fontSize: 17, fontWeight: '500' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },

  // ─── Small ───
  caption: { fontSize: 13, fontWeight: '500' as const },
  tiny: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6 },

  // ─── Special ───
  button: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.2 },
  label: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
};
