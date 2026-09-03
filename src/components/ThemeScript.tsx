/** Evita flash de tema / macros incorrectos antes de hidratar. Default: oscuro + macros a color. */
export function ThemeScript() {
  const code = `(function(){try{var r=document.documentElement;var t=localStorage.getItem('theme');var dark=t!=='light';r.classList.toggle('dark',dark);r.style.colorScheme=dark?'dark':'light';r.classList.toggle('macros-mono',localStorage.getItem('macrosColor')==='mono');}catch(e){document.documentElement.classList.add('dark');}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
    />
  );
}
