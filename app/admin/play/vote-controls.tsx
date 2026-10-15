"use client";

import { useActionState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { voteCaption } from "./actions";

export function VoteControls({ id, upvotes, downvotes, ownVote, isOwn }: {
  id: string; upvotes: number; downvotes: number; ownVote: number; isOwn: boolean;
}) {
  const [state, action, pending] = useActionState(voteCaption, {});
  return <div className="play-vote-wrap">
    <form action={action} className="play-votes" aria-label="Caption rating">
      <input type="hidden" name="caption_id" value={id}/>
      <button type="submit" name="value" value={ownVote === 1 ? 0 : 1} disabled={pending || isOwn} aria-pressed={ownVote === 1} aria-label={ownVote === 1 ? "Remove upvote" : "Upvote"}><ThumbsUp size={18}/>{upvotes}</button>
      <button type="submit" name="value" value={ownVote === -1 ? 0 : -1} disabled={pending || isOwn} aria-pressed={ownVote === -1} aria-label={ownVote === -1 ? "Remove downvote" : "Downvote"}><ThumbsDown size={18}/>{downvotes}</button>
      {isOwn && <small>Your caption · other players can rate it</small>}
    </form>
    {state.error && <span className="play-vote-error" role="alert">{state.error}</span>}
    {state.success && <span className="sr-only" role="status">{state.success}</span>}
  </div>;
}
