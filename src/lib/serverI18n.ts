import { cookies } from "next/headers";
import { translations, Language, TranslationKey } from "./i18n";

export async function getServerTranslation() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("language")?.value as Language) || "ar";
  return {
    t: (key: TranslationKey) => translations[lang][key] || key,
    lang
  };
}
