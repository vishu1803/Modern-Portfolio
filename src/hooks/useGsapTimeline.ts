import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGsapTimeline() {
  useEffect(() => {
    // Boilerplate for global GSAP instances if needed
  }, []);
}
