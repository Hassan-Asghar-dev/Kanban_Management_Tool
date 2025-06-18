import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function SmallNavbar() {
  const [open, setOpen] = useState(false);

  const links = [
    { name: "Home", href: "#" },
    { name: "Projects", href: "#" },
    { name: "Blog", href: "#" },
    { name: "Contact", href: "#" },
  ];

  return (
    <nav className="text-white sticky top-4 z-50 flex justify-center">
      <div className="w-full max-w-md mx-4 rounded-full bg-[#0a0a0a] px-6 py-3 shadow-[0_0_15px_5px_rgba(168,85,247,0.3)] border border-[#2a2a2a]">
        <div className="flex items-center justify-center">
          {/* Desktop Links - centered */}
          <ul className="hidden md:flex space-x-6">
            {links.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="text-lg text-gray-300 hover:text-white hover:underline underline-offset-4 transition-all duration-200"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setOpen(!open)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <ul className="md:hidden mt-3 space-y-2 text-sm bg-[#1a1a1a] rounded-lg p-2 border border-[#2a2a2a]">
            {links.map((link) => (
              <li key={link.name}>
                <a
                  href={link.href}
                  className="block px-3 py-2 rounded-full text-gray-300 hover:text-white hover:bg-[#2a2a2a] transition"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </nav>
  );
}
