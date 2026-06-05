import { Link, useLocation } from "react-router-dom";

export default function Navbar() {
	const location = useLocation();

	const isActive = (path) => location.pathname === path;

	return (
		<nav
			className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm shadow-black/5"
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
					<span className="text-sm font-semibold text-text-primary tracking-[-0.02em]">
						Narad
					</span>
				</Link>

				{/* Nav Links */}
				<div className="flex items-center">
					<Link
						to="/"
						className={`px-3 py-1.5 rounded text-xs font-medium transition-colors duration-150 ${isActive("/")
								? "bg-surface text-text-primary"
								: "text-text-muted hover:text-text-primary hover:bg-surface-alt"
							}`}
					>
						Home
					</Link>
				</div>

			</div>
		</nav>
	);
}