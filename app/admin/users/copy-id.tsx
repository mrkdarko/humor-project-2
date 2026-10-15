"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { shortId } from "@/lib/format";

export function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return <button type="button" className="copy-id" title={`Copy ${id}`} aria-label={`Copy profile ID ${id}`} onClick={copy}><code>{shortId(id)}</code>{copied ? <Check size={14}/> : <Copy size={14}/>}</button>;
}

