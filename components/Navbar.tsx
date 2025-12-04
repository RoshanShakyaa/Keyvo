import Link from "next/link";
import { Trophy, Users } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import UserDropDown from "./Avatar";

const Navbar = async () => {
  return (
    <header className="sticky top-0 z-50 w-full  backdrop-blur">
      <div className=" flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <h1 className="text-2xl font-bold tracking-tighter">
            Key<span className="text-blue-500">vo</span>
          </h1>
        </Link>

        <nav className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  <Trophy className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Leaderboard</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/friends"
                  className="flex items-center gap-2 transition-colors hover:text-foreground"
                >
                  <Users className="size-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent>
                <p>Friends</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <UserDropDown />
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
