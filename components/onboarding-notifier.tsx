"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OnboardingNotifierProps {
  tmdbApiKey?: string;
  hasAccounts: boolean;
}

export function OnboardingNotifier({ tmdbApiKey, hasAccounts }: OnboardingNotifierProps) {
  const router = useRouter();

  useEffect(() => {
    // If the API key is not set, prompt the user to set it up
    if (!tmdbApiKey) {
      // Small timeout to ensure hydration and toast system is ready
      const timer = setTimeout(() => {
        toast.info("Welcome to WebDoma!", {
          id: "onboarding-toast", // Prevent duplicate toasts
          description: "Please configure your TMDB API Key before adding any TorBox accounts.",
          duration: 10000,
          position: "top-center",
          action: {
            label: "Setup Now",
            onClick: () => router.push("/accounts"),
          },
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [tmdbApiKey, hasAccounts, router]);

  return null;
}
