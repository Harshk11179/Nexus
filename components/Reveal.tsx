"use client";

import { motion } from "framer-motion";
import { entrance } from "@/lib/motion";

/**
 * Section entrance: 24px upward fade, 0.9s, staggered 0.08s per index.
 * Pass `i` to stagger siblings. Transform and opacity only.
 */
export default function Reveal({
  children,
  i = 0,
  className = "",
  as = "div",
}: {
  children: React.ReactNode;
  i?: number;
  className?: string;
  as?: "div" | "li" | "p" | "h2" | "h3";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={entrance}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      custom={i}
    >
      {children}
    </Tag>
  );
}
