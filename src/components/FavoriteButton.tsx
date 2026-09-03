"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleFavoriteAction } from "@/lib/actions/meals";

type Props = {
  mealId: string;
  isFavorite: boolean;
};

export function FavoriteButton({ mealId, isFavorite }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await toggleFavoriteAction(mealId);
          router.refresh();
        });
      }}
      className={`min-h-11 rounded-2xl px-4 text-sm font-semibold disabled:opacity-60 ${
        isFavorite
          ? "bg-primary text-white"
          : "border border-border bg-card text-foreground"
      }`}
    >
      {isFavorite ? "★ Favorito" : "☆ Favorito"}
    </button>
  );
}
