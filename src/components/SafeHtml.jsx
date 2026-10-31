import DOMPurify from "dompurify";

// Rend du HTML provenant de l'API refuges.info (format_texte=html) en le sanitizant.
// L'API peut renvoyer <br>, <a>, <b>... dans acces/remarque/commentaires :
// sans ce rendu, les balises apparaîtraient en texte brut à l'écran.
export default function SafeHtml({ html, className }) {
  const clean = DOMPurify.sanitize(html || "", { USE_PROFILES: { html: true } });
  return <div className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
