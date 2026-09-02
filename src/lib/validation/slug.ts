const ARABIC_SLUG_MAP: Record<string, string> = {
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ا: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ة: 'a',
  ء: '',
  ئ: 'y',
  ؤ: 'w',
};

export function slugifyTitle(title: string) {
  const transliterated = [...title.trim().toLowerCase()]
    .map((char) => {
      if (ARABIC_SLUG_MAP[char]) return ARABIC_SLUG_MAP[char];
      if (/[a-z0-9]/.test(char)) return char;
      if (/\s|-|_/.test(char)) return '-';
      return '';
    })
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return transliterated || 'question';
}

export function uniqueSlug(base: string, existing: string[]) {
  const set = new Set(existing);
  if (!set.has(base)) return base;

  let index = 2;
  let candidate = `${base}-${index}`;
  while (set.has(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }
  return candidate;
}
