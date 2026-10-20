const fs = require('node:fs');
const path = require('node:path');
const front = path.resolve(__dirname, '../../frontend');
const file = name => path.join(front, name);
let code = fs.readFileSync(file('app/i18n.tsx'), 'utf8');
const before = code.split('\n').length;
// Only locale selection is used by the Wins UI. The copied legacy dictionary has no consumers.
code = code.slice(0, code.indexOf('const sharedValues')) + `
const I18nContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: "zh", setLocale: () => {} });

function subscribeLocale(callback: () => void) {
  window.addEventListener("wins:locale", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("wins:locale", callback);
    window.removeEventListener("storage", callback);
  };
}
function getLocale(): Locale {
  const stored = localStorage.getItem("wins-locale");
  return localeOptions.some(item => item.code === stored) ? stored as Locale : "zh";
}
function setLocale(locale: Locale) {
  localStorage.setItem("wins-locale", locale);
  window.dispatchEvent(new Event("wins:locale"));
}
export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => "zh" as Locale);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() { return useContext(I18nContext); }
`;
fs.writeFileSync(file('app/i18n.tsx'), code);
console.log('Removed '+(before-code.split('\n').length)+' unused legacy i18n lines.');
const envPath=file('.env.local');
let env=fs.readFileSync(envPath,'utf8');
env=env.replace(/^NEXT_PUBLIC_API_BASE_URL=.*$/m,'NEXT_PUBLIC_API_BASE_URL=/api/v1').replace(/^MOCK_API_ENABLED=.*$/m,'MOCK_API_ENABLED=false');
if(!/^API_PROXY_TARGET=/m.test(env)) env+='\nAPI_PROXY_TARGET=http://127.0.0.1:4001\n';
fs.writeFileSync(envPath,env);
// Preserve any existing private password/configuration; only routing defaults change.
console.log('Default local environment now routes to NestJS; Mock disabled.');
