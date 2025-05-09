import { Link, useLocation } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, BotIcon, LogOutIcon} from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  const { logoutMutation } = useLogout();

  return (
    <div className="group fixed top-0 left-0 w-full z-30 h-3 hover:h-16 transition-all duration-300 ease-in-out overflow-visible">
      <nav className="bg-base-200 border-b border-base-300 h-16 flex items-center transform -translate-y-16 group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end w-full">
            {isChatPage && (
              <div className="pl-5">
                <Link to="/" className="flex items-center gap-2.5">
                  <BotIcon className="size-9 text-primary" />
                  <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                    ChatterBox
                  </span>
                </Link>
              </div>
            )}

            <div className="flex items-center gap-3 sm:gap-4 ml-auto">
              <Link to={"/notifications"}>
                <button className="btn btn-ghost btn-circle" aria-label="Notifications">
                  <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                </button>
              </Link>
            </div>

            <ThemeSelector />

            <div className="avatar">
              <div className="w-9 rounded-full">
                <img src={authUser?.profilePic || "/default-avatar.png"} alt="User Avatar" />
              </div>
            </div>

            <button className="btn btn-ghost btn-circle" onClick={logoutMutation} aria-label="Log out">
              <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;