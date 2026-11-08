// The current time in unix seconds, updated every second: drives deadline countdowns and the
// lobby's next step (which depends on deadlines).

import { useEffect, useState } from "react";

function now(): number {
  return Math.floor(Date.now() / 1000);
}

/** Unix seconds, re-rendering the caller once a second. */
export function useNowSeconds(): number {
  const [seconds, setSeconds] = useState(now);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds(now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);
  return seconds;
}
