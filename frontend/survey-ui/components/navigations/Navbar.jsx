"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const pathname = usePathname();

  const navClass = (path) =>
    `px-2 py-1 border-b-2 transition ${pathname === path
      ? "border-black text-black"
      : "border-transparent text-gray-600 hover:text-black"
    }`;

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Narad-Logo.svg"
            alt="Narad"
            width={48}
            height={48}
          />
          <div className="font-semibold text-base">Narad</div>
        </Link>

        {/* Navigation */}
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/" className={navClass("/")}>
            Home
          </Link>
        </div>
      </div>
    </nav>
  );
}
