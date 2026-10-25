"use client";

import { useActionState } from "react";
import { deleteCatalog, type CatalogState } from "./actions";

export function CatalogDeleteButton({ resource, id }: { resource: string; id: string }) {
  const [state, action, pending] = useActionState(deleteCatalog, { error: "" } as CatalogState);
  return <form action={action} onSubmit={event => { if (!window.confirm("Delete this record? This cannot be undone.")) event.preventDefault(); }}><input type="hidden" name="resource" value={resource}/><input type="hidden" name="id" value={id}/><button className="danger-button" disabled={pending} type="submit">{pending ? "Deleting..." : "Delete record"}</button>{state.error && <div className="alert" role="alert">{state.error}</div>}</form>;
}
