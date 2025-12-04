"use client";
import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useSignout } from "@/hooks/use-signout";

const LogOutBtn = () => {
  const signout = useSignout();

  return (
    <Button onClick={signout}>
      <LogOut className="mr-2 h-4 w-4" />
      <span>Log out</span>
    </Button>
  );
};

export default LogOutBtn;
