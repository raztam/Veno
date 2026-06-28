export function formatDetectedLanguage(code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }

  try {
    return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) ?? code;
  } catch {
    return code;
  }
}
