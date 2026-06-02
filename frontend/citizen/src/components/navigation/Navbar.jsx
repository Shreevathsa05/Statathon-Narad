import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
	const location = useLocation();

	const isActive = (path) => location.pathname === path;

	return (
		<nav
			className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#2E2E2E]"
			style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
		>
			<div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

				{/* Logo */}
				<Link to="/" className="flex items-center gap-2.5">
					<img
						src="/Narad-Logo.svg"
						alt="Narad"
						className="w-6 h-6"
					/>
					<span className="text-sm font-semibold text-[#EDEDED] tracking-[-0.02em]">
						Narad
					</span>
				</Link>

				{/* Nav Links */}
				<div className="flex items-center">
					<Link
						to="/"
						className={`px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150 ${isActive("/")
								? "bg-[#1F1F1F] text-[#EDEDED]"
								: "text-[#525252] hover:text-[#A1A1A1] hover:bg-[#0A0A0A]"
							}`}
					>
						Home
					</Link>
				</div>

			</div>
		</nav>
	);
}