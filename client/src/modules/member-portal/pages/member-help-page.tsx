"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { BookOpen, Clock3, Mail, MapPin, MessageCircle, Phone, Search, Send, UsersRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/modules/i18n/language-provider";
import contactMessages from "../../public-pages/contact-messages.json";

type HelpArticle = { id: string; question: string; answer: string };

// No approved FAQ or knowledge-base source is connected to the member portal yet.
const approvedHelpArticles: HelpArticle[] = [];
const supportEmail = "info@tge-cameroon.org";
const supportPhone = "+237 675 123 456";
const supportPhoneHref = "+237675123456";

export function MemberHelpPage() {
  const { locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const isFrench = locale === "fr";
  const contact = isFrench ? contactMessages.fr : contactMessages.en;
  const text = isFrench ? {
    title: "Aide et soutien", intro: "Nous sommes là pour vous aider. Trouvez des réponses ou contactez notre équipe.", search: "Rechercher de l’aide (programmes, événements, compte…)", searchButton: "Rechercher", knowledge: "Base de connaissances", knowledgeCopy: "Parcourez les guides, tutoriels et articles d’aide.", browse: "Parcourir les articles", faqs: "FAQ", faqCopy: "Trouvez rapidement des réponses aux questions fréquentes.", viewFaqs: "Voir les FAQ", contactSupport: "Contacter le soutien", contactCopy: "Besoin d’aide ? Consultez les coordonnées officielles de TGE.", contactUs: "Nous contacter", liveSupport: "Soutien téléphonique", liveCopy: "Appelez-nous pendant les heures de bureau publiées.", call: "Appeler TGE", questions: "Foire aux questions", viewAll: "Tout voir", contactTeam: "Contacter notre équipe", subject: "Sujet", selectSubject: "Choisir un sujet", messageLabel: "Message", describe: "Décrivez votre problème ou votre question…", send: "Envoyer le message", supportHours: "Heures de bureau", unavailable: "Les demandes sont bloquées jusqu’à l’approbation du service de soutien et de l’avis de confidentialité. Aucun message n’a été envoyé.", otherWays: "Autres façons d’obtenir de l’aide", email: "Courriel", callUs: "Appelez-nous", visit: "Nous visiter", community: "Rejoindre la communauté", communityCopy: "Connectez-vous avec d’autres membres pour obtenir du soutien et des conseils.", noResults: "Aucun article d’aide approuvé ne correspond à cette recherche.", noApprovedArticles: "Les articles d’aide approuvés ne sont pas encore disponibles.",
  } : {
    title: "Help & Support", intro: "We are here to help. Find answers or contact our team.", search: "Search for help (e.g. programmes, events, account…)", searchButton: "Search", knowledge: "Knowledge Base", knowledgeCopy: "Browse guides, tutorials, and help articles.", browse: "Browse Articles", faqs: "FAQs", faqCopy: "Find quick answers to common questions.", viewFaqs: "View FAQs", contactSupport: "Contact Support", contactCopy: "Need more help? Use TGE’s published contact details.", contactUs: "Contact Us", liveSupport: "Live Support", liveCopy: "Call during the published office hours.", call: "Call TGE", questions: "Frequently Asked Questions", viewAll: "View All", contactTeam: "Contact Our Support Team", subject: "Subject", selectSubject: "Select a subject", messageLabel: "Message", describe: "Describe your issue or question…", send: "Send Message", supportHours: "Office Hours", unavailable: "Support requests are blocked until TGE approves the support handler and privacy notice. No message has been sent.", otherWays: "Other Ways to Get Help", email: "Email Us", callUs: "Call Us", visit: "Visit Us", community: "Join Our Community", communityCopy: "Connect with other members for support and advice.", noResults: "No approved help articles match this search.", noApprovedArticles: "Approved help articles are not available yet.",
  };
  const searchTerm = submittedSearch.toLocaleLowerCase();
  const helpArticles = approvedHelpArticles.filter((article) => `${article.question} ${article.answer}`.toLocaleLowerCase().includes(searchTerm));
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const searchHelp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittedSearch(query.trim());
    scrollTo("member-help-faqs");
  };

  const cards: { icon: LucideIcon; title: string; copy: string; action: string; target: string; color: string }[] = [
    { icon: BookOpen, title: text.knowledge, copy: text.knowledgeCopy, action: text.browse, target: "member-help-faqs", color: "bg-[#EDF7F0] text-[#087443]" },
    { icon: MessageCircle, title: text.faqs, copy: text.faqCopy, action: text.viewFaqs, target: "member-help-faqs", color: "bg-[#EDF5FC] text-[#2675B8]" },
    { icon: Mail, title: text.contactSupport, copy: text.contactCopy, action: text.contactUs, target: "member-contact-form", color: "bg-[#F5F0FC] text-[#8051B0]" },
    { icon: Phone, title: text.liveSupport, copy: text.liveCopy, action: text.call, target: `tel:${supportPhoneHref}`, color: "bg-[#FFF6E7] text-[#C28100]" },
  ];

  return <section aria-labelledby="member-help-title" className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 id="member-help-title" className="text-2xl font-bold text-[#111B16] sm:text-3xl">{text.title}</h1><p className="mt-2 max-w-2xl text-sm text-[#59645D]">{text.intro}</p></div>
      <form onSubmit={searchHelp} className="flex w-full gap-2 sm:max-w-md">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#D9E2DC] px-3"><Search size={17} aria-hidden="true" className="shrink-0 text-[#65746A]"/><span className="sr-only">{text.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.search} className="min-h-10 w-full bg-transparent text-xs outline-none"/></label>
        <button type="submit" className="min-h-10 rounded-lg bg-[#006B3B] px-4 text-sm font-semibold text-white">{text.searchButton}</button>
      </form>
    </header>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icon: Icon, title, copy, action, target, color }) => <article key={title} className="rounded-xl border border-[#E6ECE8] p-4">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}><Icon size={21} aria-hidden="true"/></span>
        <h2 className="mt-3 font-bold text-[#17211B]">{title}</h2><p className="mt-1 min-h-10 text-sm text-[#59645D]">{copy}</p>
        {target.startsWith("tel:") ? <a href={target} className="mt-3 flex min-h-9 items-center justify-center rounded-lg bg-[#FFF6E7] text-sm font-semibold text-[#916000]">{action}</a> : <button type="button" onClick={() => scrollTo(target)} className="mt-3 min-h-9 w-full rounded-lg bg-[#F0F8F2] text-sm font-semibold text-[#087443]">{action}</button>}
      </article>)}
    </div>

    <div className="grid items-start gap-4 lg:grid-cols-2">
      <section id="member-help-faqs" className="scroll-mt-6 rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="member-help-faq-heading">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 id="member-help-faq-heading" className="font-bold text-[#17211B]">{text.questions}</h2><button type="button" onClick={() => { setSubmittedSearch(""); setQuery(""); }} className="shrink-0 text-sm font-semibold text-[#087443]">{text.viewAll} →</button></div>
        <div className="space-y-2">{helpArticles.length ? helpArticles.map(({ id, question, answer }) => <details key={id} className="rounded-lg border border-[#E6ECE8] px-3"><summary className="cursor-pointer py-3 text-sm font-medium text-[#17211B] marker:text-[#087443]">{question}</summary><p className="pb-3 text-sm leading-5 text-[#59645D]">{answer}</p></details>) : <p role="status" className="rounded-lg border border-dashed border-[#CBD8CE] p-5 text-sm text-[#59645D]">{submittedSearch ? text.noResults : text.noApprovedArticles}</p>}</div>
      </section>

      <section id="member-contact-form" className="scroll-mt-6 rounded-xl border border-[#E6ECE8] p-4 sm:p-5" aria-labelledby="member-contact-heading">
        <h2 id="member-contact-heading" className="font-bold text-[#17211B]">{text.contactTeam}</h2>
        <p role="status" className="mt-1 text-sm text-[#59645D]">{text.unavailable}</p>
        <form className="mt-4 space-y-3" onSubmit={(event) => event.preventDefault()}>
          <label className="block text-xs font-semibold">{text.subject}<select disabled className="mt-1 min-h-10 w-full rounded-lg border border-[#D9E2DC] bg-white px-3 text-sm font-normal"><option>{text.selectSubject}</option></select></label>
          <label className="block text-xs font-semibold">{text.messageLabel}<textarea disabled maxLength={500} rows={4} placeholder={text.describe} className="mt-1 w-full resize-y rounded-lg border border-[#D9E2DC] bg-white px-3 py-2 text-sm font-normal"/><span className="mt-1 block text-right text-[10px] text-[#68736C]">0/500</span></label>
          <button type="submit" disabled className="inline-flex min-h-10 w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg bg-[#006B3B] text-sm font-semibold text-white opacity-50"><Send size={15} aria-hidden="true"/>{text.send}</button>
        </form>
        <div className="mt-4 rounded-xl bg-[#F0F8F2] p-4"><h3 className="flex items-center gap-2 text-sm font-bold"><Clock3 size={17} aria-hidden="true" className="text-[#087443]"/>{text.supportHours}</h3><p className="mt-2 text-sm text-[#39443D]">{contact.hoursValue}</p></div>
      </section>
    </div>

    <section aria-labelledby="member-help-other"><h2 id="member-help-other" className="mb-3 font-bold text-[#17211B]">{text.otherWays}</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <ContactCard icon={Mail} title={text.email} value={supportEmail} href={`mailto:${supportEmail}`}/>
      <ContactCard icon={Phone} title={text.callUs} value={supportPhone} href={`tel:${supportPhoneHref}`}/>
      <ContactCard icon={MapPin} title={text.visit} value={contact.officeValue}/>
      <ContactCard icon={UsersRound} title={text.community} value={text.communityCopy} href="/portal/messages"/>
    </div></section>
  </section>;
}

function ContactCard({ icon: Icon, title, value, href }: { icon: LucideIcon; title: string; value: string; href?: string }) {
  const content = <div className="flex min-h-20 items-center gap-3 rounded-xl border border-[#E6ECE8] p-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#EDF7F0] text-[#087443]"><Icon size={18} aria-hidden="true"/></span><span className="min-w-0"><span className="block text-sm font-bold">{title}</span><span className="mt-1 block break-words text-xs text-[#59645D]">{value}</span></span></div>;
  if (href?.startsWith("/")) return <Link href={href}>{content}</Link>;
  return href ? <a href={href}>{content}</a> : content;
}
