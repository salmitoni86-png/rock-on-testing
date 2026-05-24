import { useState } from "react";
import { Share2, Copy, Check, Twitter, Facebook, Linkedin, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";

export function ShareBar({ url, title, compact = false }: { url?: string; title?: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.origin : "https://kronekort-x.lovable.app");
  const shareTitle = title ?? "Kronekort-X — saldo i sanntid, helt uten styr";
  const enc = encodeURIComponent;

  const links = [
    { Icon: Twitter, label: "X", href: `https://twitter.com/intent/tweet?text=${enc(shareTitle)}&url=${enc(shareUrl)}` },
    { Icon: Facebook, label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(shareUrl)}` },
    { Icon: Linkedin, label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(shareUrl)}` },
    { Icon: MessageCircle, label: "WhatsApp", href: `https://wa.me/?text=${enc(shareTitle + " " + shareUrl)}` },
    { Icon: Mail, label: "E-post", href: `mailto:?subject=${enc(shareTitle)}&body=${enc(shareUrl)}` },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Lenke kopiert");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Kunne ikke kopiere");
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && (navigator as Navigator).share) {
      try {
        await (navigator as Navigator).share({ title: shareTitle, url: shareUrl });
      } catch {}
    } else {
      copy();
    }
  }

  if (compact) {
    return (
      <button onClick={nativeShare} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs hover:bg-accent">
        <Share2 className="h-3.5 w-3.5" /> Del
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Del Kronekort-X</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {links.map(({ Icon, label, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </a>
        ))}
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:bg-accent"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[color:var(--income)]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Kopiert" : "Kopier lenke"}
        </button>
      </div>
    </div>
  );
}
