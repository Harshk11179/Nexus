"use client";

import { useState } from "react";
import { MotionConfig } from "framer-motion";
import Grain from "@/components/Grain";
import Cursor from "@/components/Cursor";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ScrollStory from "@/components/ScrollStory";
import Marquee from "@/components/Marquee";
import Bento from "@/components/Bento";
import Trace from "@/components/Trace";
import Stats from "@/components/Stats";
import Pricing from "@/components/Pricing";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export default function Page() {
  const [started, setStarted] = useState(false);
  return (
    <MotionConfig reducedMotion="user">
      <Grain />
      <Cursor />
      <SmoothScroll />
      <Preloader onDone={() => setStarted(true)} />
      <Nav />
      <main>
        <Hero started={started} />
        <ScrollStory />
        <Marquee />
        <Bento />
        <Trace />
        <Stats />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </MotionConfig>
  );
}
