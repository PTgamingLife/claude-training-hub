"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  displayName,
  ensureCourseProfile,
  getSession,
  supabase,
} from "./supabase";

export function useSignedInUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const accept = (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      setLoading(false);
      if (nextUser) void ensureCourseProfile(nextUser);
    };

    getSession()
      .then((session) => accept(session?.user ?? null))
      .catch(() => active && setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      accept(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    displayName: user ? displayName(user) : "",
  };
}
