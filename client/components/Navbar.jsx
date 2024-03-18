import Link from "next/link";
import FIRSLogo from "./mysvg";
import ThemeSelector from "./ThemeSelector";
import useAuth from "../store/authStore";
import download from "../images/download.png";
import blue from "../images/download-grey.png";
import firs from "../images/firs_dark_logo.png";
import Image from "next/image";

const Navbar = () => {
    const navlinks = useAuth((state) => {
        return state.navLinks;
    })();
    const token = useAuth((state) => {
        return state.decodedToken;
    })();

    return (
        <nav className="navbar w-full  sm:rounded-xl">
            <div className="navbar-start">
                <Link href="/">
                    <Image src={blue} alt="download" width={90} height={50} />
                </Link>
                <Link href="/">
                    <a className="navIcon btn btn-ghost text-xl normal-case">
                        FEDERAL INLAND REVENUE SERVICE{" "}
                    </a>
                </Link>
            </div>
            <div className="navbar-end space-x-5 text-xs text-neutral-content md:text-sm">
                <div>
                    <ThemeSelector />
                </div>
                {token && (
                    <Link href="/visitorDashboard">
                        <a>
                            <div
                                className={
                                    "avatar placeholder rounded-full " +
                                    (token.permission === 0
                                        ? "bg-primary"
                                        : token.permission === 1
                                        ? "bg-secondary"
                                        : "bg-accent")
                                }
                            >
                                <div className="w-10 text-primary-content">
                                    <span className="text-xl">
                                        {token ? token.name[0] : ""}
                                    </span>
                                </div>
                            </div>
                        </a>
                    </Link>
                )}
                <div className="dropdown-end dropdown">
                    <label tabIndex="0" className="menuIcon btn btn-ghost">
                        <svg
                            width="16"
                            height="12"
                            viewBox="0 0 16 12"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <rect
                                className="menuPath"
                                width="16"
                                height="2"
                                rx="1"
                                fill="#D9D9D9"
                            />
                            <rect
                                className="menuPath"
                                y="5"
                                width="16"
                                height="2"
                                rx="1"
                                fill="#D9D9D9"
                            />
                            <rect
                                className="menuPath"
                                y="10"
                                width="16"
                                height="2"
                                rx="1"
                                fill="#D9D9D9"
                            />
                        </svg>
                    </label>
                    <ul
                        tabIndex="0"
                        className="dropdown-content menu rounded-box menu-compact mt-3 w-52 bg-neutral p-2 text-neutral-content shadow"
                    >
                        {navlinks.map((link, idx) => {
                            return (
                                <Link key={idx} href={link.path}>
                                    <a
                                        className="btn btn-ghost"
                                        onClick={link.onClick && link.onClick}
                                    >
                                        {link.content}
                                    </a>
                                </Link>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
