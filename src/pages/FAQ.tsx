import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";

type FaqLinkDef = { textKey: string; path: string };

type FaqItemDef = {
  id: string;
  linkDefs?: FaqLinkDef[];
};

const FAQ_ITEMS: FaqItemDef[] = [
  { id: "whatIs", linkDefs: [{ textKey: "faq.items.whatIs.linkWhatIs", path: "/what-is-palette-plotting" }] },
  { id: "notTherapy" },
  { id: "whoCanUse" },
  { id: "automated" },
  { id: "privacy" },
  { id: "plans", linkDefs: [{ textKey: "faq.items.plans.linkBilling", path: "/billing" }] },
  { id: "cancel" },
  { id: "sellData" },
  { id: "deleteAccount" },
  { id: "acceptableUse" },
  {
    id: "legalTerms",
    linkDefs: [
      { textKey: "faq.items.legalTerms.linkTerms", path: "/terms" },
      { textKey: "faq.items.legalTerms.linkPrivacy", path: "/privacy" },
      { textKey: "faq.items.legalTerms.linkAcceptableUse", path: "/acceptable-use" },
      { textKey: "faq.items.legalTerms.linkDmca", path: "/dmca" },
    ],
  },
];

function renderAnswerWithLinks(
  answer: string,
  linkDefs: FaqLinkDef[] | undefined,
  t: (key: string) => string,
  navigate: (path: string) => void,
) {
  if (!linkDefs?.length) return answer;

  const links: Record<string, string> = {};
  for (const def of linkDefs) {
    links[t(def.textKey)] = def.path;
  }

  let text = answer;
  const parts: Array<{ type: "text" | "link"; content: string; path?: string }> = [];
  let lastIndex = 0;

  const matches: Array<{ index: number; text: string; path: string }> = [];
  Object.entries(links).forEach(([linkText, path]) => {
    const index = text.indexOf(linkText);
    if (index !== -1) {
      matches.push({ index, text: linkText, path });
    }
  });

  matches.sort((a, b) => a.index - b.index);

  matches.forEach((match) => {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: "link", content: match.text, path: match.path });
    lastIndex = match.index + match.text.length;
  });

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.substring(lastIndex) });
  }

  return parts.map((part, i) =>
    part.type === "link" ? (
      <button
        key={i}
        onClick={() => navigate(part.path!)}
        className="text-primary hover:underline font-medium"
      >
        {part.content}
      </button>
    ) : (
      <span key={i}>{part.content}</span>
    ),
  );
}

const FAQ = () => {
  const { t } = useMarketingTranslation();
  const navigate = useNavigate();

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-4xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{t("faq.title")}</h1>
          <p className="text-muted-foreground">
            {t("faq.subtitle")}
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((faq) => (
            <Card key={faq.id}>
              <CardHeader>
                <CardTitle className="text-lg">{t(`faq.items.${faq.id}.question`)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-line">
                  {renderAnswerWithLinks(
                    t(`faq.items.${faq.id}.answer`),
                    faq.linkDefs,
                    t,
                    navigate,
                  )}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MarketingSiteLayout>
  );
};

export default FAQ;
