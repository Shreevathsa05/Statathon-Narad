import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const { pathname } = useLocation();

  const navClass = (path) =>
    `px-2 py-1 border-b-2 transition ${
      pathname === path
        ? "border-black text-black"
        : "border-transparent text-gray-600 hover:text-black"
    }`;

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/Narad-Logo.svg"
            alt="Narad"
            className="h-12 w-12"
          />
          <div className="leading-tight">
            <div className="font-semibold text-base">Narad</div>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex gap-6 text-sm font-medium">
          <Link to="/" className={navClass("/")}>
            Home
          </Link>
          <Link to="/generate" className={navClass("/generate")}>
            Generate
          </Link>
        </div>
      </div>
    </nav>
  );
}
