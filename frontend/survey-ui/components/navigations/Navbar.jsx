"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();

  const navClass = (path) =>
    `relative px-3 py-2 text-sm font-medium transition-colors duration-200
     ${
       pathname === path
         ? "text-blue-600"
         : "text-gray-600 hover:text-blue-600"
     }`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/Narad-Logo.svg"
            alt="Narad"
            width={40}
            height={40}
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-lg font-semibold text-gray-900 tracking-tight">
            Narad
          </span>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className={navClass("/")}>
            Home
            {pathname === "/" && (
              <span className="absolute left-0 -bottom-2 w-full h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
}
