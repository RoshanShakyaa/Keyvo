"use client";
import { Button } from "./ui/button";
import { useSignout } from "@/hooks/use-signout";

const LogOutBtn = () => {
  const signout = useSignout();

  return <Button onClick={signout}>Logout</Button>;
};

export default LogOutBtn;
