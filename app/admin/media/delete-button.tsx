"use client";
import { deleteMedia } from "./actions";
export function DeleteButton({ id }: { id: string }) {
  return <form action={deleteMedia} onSubmit={event => { if (!window.confirm("Delete this caption, its generation, and all its votes? This cannot be undone.")) event.preventDefault(); }}><input type="hidden" name="id" value={id}/><button type="submit" className="danger-button">Delete media</button></form>;
}
