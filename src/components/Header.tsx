import { useState, useRef, useEffect } from "react";
import './Header.css';

function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header>
      <nav>
        <ul>
          <li
            className={`dropdown${dropdownOpen ? " open" : ""}`}
            ref={dropdownRef}
          >
            <span
              className="dropdown-title"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen((open) => !open);
              }}
            >
              Projects
            </span>
            <ul className="dropdown-content">
              <li>
                <a href="https://www.blockchaininnovationlab.io/paymentdapp/index.html">
                  Payment dApp
                </a>
              </li>
              <li>
                <a href="https://www.blockchaininnovationlab.io/savethebeesjerseycity.html">
                  Save The Bees Jersey City
                </a>
              </li>
              <li>
                <a href="https://www.blockchaininnovationlab.io/airtimearena/">
                  AirTimeArena
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
