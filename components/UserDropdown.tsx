"use client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { LogOut, Settings, User, UserRound } from "lucide-react";
import { useSignout } from "@/hooks/use-signout";
import { authClient } from "@/lib/auth-client";

const UserDropDown = () => {
  const handleSignout = useSignout();
  const { data } = authClient.useSession();
  const user = data?.user;
  return (
    <div className="flex items-center gap-4">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer text-gray-600 relative h-10 w-auto gap-2 rounded-full pl-2 pr-4 ">
              <UserRound className="size-5" />
              <div className="flex flex-col items-start text-sm">
                <span className="font-semibold leading-none">{user.name}</span>
              </div>
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className=" cursor-pointer"
              onClick={handleSignout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild variant={"ghost"}>
          <Link href="/login">
            <UserRound className="size-5 text-gray-600 " />
          </Link>
        </Button>
      )}
    </div>
  );
};

export default UserDropDown;
