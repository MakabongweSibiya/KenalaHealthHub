export const FIXED_DEPOSIT_AMOUNT = 200;

export interface ClinicLocationInfo {
  id: string;
  label: string;
  type: "CLINIC" | "MOBILE";
  area: string;
  defaultAddress: string;
  mapsQuery: string;
}

export const CLINIC_OPTIONS: ClinicLocationInfo[] = [
  {
    id: "nellmapius_clinic",
    label: "Totus Studio — Location 1 (In-Studio)",
    type: "CLINIC",
    area: "Pretoria East",
    defaultAddress: "Totus Massage & Aesthetics Studio, Pretoria East",
    mapsQuery: "Pretoria East, Pretoria, South Africa",
  },
  {
    id: "moreleta_clinic",
    label: "Totus Studio — Location 2 (In-Studio)",
    type: "CLINIC",
    area: "Moreleta Park",
    defaultAddress: "Totus Studio, Moreleta Park, Pretoria East",
    mapsQuery: "Moreleta Park, Pretoria East, Pretoria, South Africa",
  },
  {
    id: "mobile_visit",
    label: "Mobile Spa Visit (Therapist Comes to Your Address)",
    type: "MOBILE",
    area: "Pretoria East",
    defaultAddress: "",
    mapsQuery: "",
  },
];

export const MOBILE_AREAS = [
  "Nellmapius",
  "Moreleta Park",
  "Equestria",
  "Silverlakes",
  "Garsfontein",
  "Faerie Glen",
  "Wapadrand",
  "Mooikloof",
  "Menlyn / Lynnwood",
  "Pretoria East (Other)",
];

export function getGoogleMapsUrl(address: string, area?: string): string {
  const fullQuery = area && !address.toLowerCase().includes(area.toLowerCase())
    ? `${address}, ${area}, Pretoria, South Africa`
    : `${address}, South Africa`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullQuery)}`;
}

/**
 * Checks if a word looks like random keyboard mashing / gibberish
 * e.g., "uieagsdiuqewgd", "asdfghjkl", "zzzzzz"
 */
function isGibberishWord(word: string): boolean {
  const clean = word.toLowerCase().replace(/[^a-z]/g, "");
  if (clean.length === 0) return false;

  // 1. 3 or more identical consecutive characters (e.g. "aaaa")
  if (/(.)\1\1/.test(clean)) return true;

  // 2. 6 or more consecutive consonants (allow common SA clusters like "ntsh", "ngw", "mpf")
  if (/[bcdfghjklmnpqrstvwxz]{6,}/.test(clean)) return true;

  // 3. 5 or more consecutive vowels (e.g. "uieag" in "uieagsdiuqewgd")
  if (/[aeiou]{5,}/.test(clean)) return true;

  // 4. Very long single word (> 13 chars) with strange vowel/consonant alternation or keyboard mash patterns
  if (clean.length >= 12) {
    const uniqueChars = new Set(clean.split("")).size;
    if (uniqueChars < 4) return true;
  }

  // 5. Common QWERTY row mashes
  const qwertyMashes = ["asdf", "sdfg", "dfgh", "fghj", "ghjk", "hjkl", "qwer", "wert", "erty", "rtyu", "zxcv", "xcvb"];
  let mashHits = 0;
  for (const m of qwertyMashes) {
    if (clean.includes(m)) mashHits++;
  }
  if (mashHits >= 1 && clean.length >= 6) return true;

  // 6. Check if word has zero vowels and is longer than 3 letters
  if (clean.length > 3 && !/[aeiouy]/.test(clean)) return true;

  return false;
}

/**
 * Validates that the patient entered both First Name and Surname (at least 2 valid words)
 */
export function validateFullName(input: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  const trimmed = input.trim().replace(/\s+/g, " ");

  if (!trimmed) {
    return {
      isValid: false,
      formatted: "",
      error: "Please enter your full name and surname.",
    };
  }

  const parts = trimmed.split(" ");
  if (parts.length < 2) {
    return {
      isValid: false,
      formatted: trimmed,
      error: "Please enter both your first name and surname (e.g. Lerato Khumalo).",
    };
  }

  for (const part of parts) {
    if (part.length < 2) {
      return {
        isValid: false,
        formatted: trimmed,
        error: "Each name and surname must be at least 2 letters long.",
      };
    }

    if (!/^[a-zA-ZÀ-ÿ'-]+$/.test(part)) {
      return {
        isValid: false,
        formatted: trimmed,
        error: "Name and surname may only contain letters, hyphens, or apostrophes.",
      };
    }

    if (isGibberishWord(part)) {
      return {
        isValid: false,
        formatted: trimmed,
        error: `"${part}" does not appear to be a valid name. Please enter your real name and surname.`,
      };
    }
  }

  // Format cleanly into Title Case
  const formatted = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");

  return {
    isValid: true,
    formatted,
  };
}

/**
 * Validates a physical street address for mobile visits
 */
export function validatePhysicalAddress(input: string): {
  isValid: boolean;
  formatted: string;
  error?: string;
} {
  const trimmed = input.trim().replace(/\s+/g, " ");

  if (!trimmed || trimmed.length < 6) {
    return {
      isValid: false,
      formatted: trimmed,
      error: "Please enter a complete street address or select a verified location from the search list.",
    };
  }

  const words = trimmed.split(/[\s,]+/).filter(Boolean);
  if (words.length < 2) {
    return {
      isValid: false,
      formatted: trimmed,
      error: "Please enter a valid street address including street name and number/suburb (e.g. 14 Lois Avenue, Menlyn, Pretoria).",
    };
  }

  // Check each alphabetic word for gibberish like "uieagsdiuqewgd"
  const alphaWords = words.filter((w) => /[a-zA-Z]{4,}/.test(w));
  if (alphaWords.length === 0) {
    return {
      isValid: false,
      formatted: trimmed,
      error: "Please include a valid street or complex name in your address.",
    };
  }

  for (const w of alphaWords) {
    if (isGibberishWord(w)) {
      return {
        isValid: false,
        formatted: trimmed,
        error: "Please enter a real, verifiable street address or select one from the Google Maps address search.",
      };
    }
  }

  return {
    isValid: true,
    formatted: trimmed,
  };
}
