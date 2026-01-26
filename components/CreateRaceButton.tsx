"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRaceSchema, raceSchemaType } from "@/lib/zodSchema";
import { createRace } from "@/app/actions/race";
import { UsersRound } from "lucide-react";

export function CreateRaceButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [createRacePending, startRaceTransition] = useTransition();

  const form = useForm<raceSchemaType>({
    resolver: zodResolver(createRaceSchema),
    defaultValues: {
      duration: 60,
      punctuation: true,
      numbers: false,
    },
  });

  function onSubmit(values: raceSchemaType) {
    startRaceTransition(async () => {
      const { code } = await createRace(values);
      setOpen(false);
      router.push(`/race/${code}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex px-6 py-3 items-center gap-2 bg-primary  rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          disabled={createRacePending}
        >
          <UsersRound className="size-4" />
          Create Race Lobby
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Multiplayer Race</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* DURATION */}
          <div className="space-y-2">
            <label className="font-semibold text-sm">Race Duration</label>
            <select
              {...form.register("duration", { valueAsNumber: true })}
              className="w-full p-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-primary focus:outline-none"
            >
              <option value={30}>30 seconds - Sprint</option>
              <option value={60}>60 seconds - Standard</option>
              <option value={120}>2 minutes - Marathon</option>
            </select>
            <p className="text-xs text-gray-400">
              All players will type for the same amount of time
            </p>
          </div>

          {/* TEXT MODIFIERS */}
          <div className="space-y-2">
            <label className="font-semibold text-sm">Text Difficulty</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-800/50 transition-colors">
                <input
                  type="checkbox"
                  {...form.register("punctuation")}
                  className="w-4 h-4 rounded border-gray-700 text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-medium">Include Punctuation</div>
                  <div className="text-xs text-gray-400">
                    Commas, periods, quotes, etc.
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-800/50 transition-colors">
                <input
                  type="checkbox"
                  {...form.register("numbers")}
                  className="w-4 h-4 rounded border-gray-700 text-primary focus:ring-primary"
                />
                <div>
                  <div className="text-sm font-medium">Include Numbers</div>
                  <div className="text-xs text-gray-400">
                    Mix in numerical digits
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={createRacePending}
            className="w-full px-6 py-3 bg-primary text-black rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createRacePending ? "Creating..." : "Create Race"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
