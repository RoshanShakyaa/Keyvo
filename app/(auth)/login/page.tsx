"use client";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { registerSchema, registerSchemaType } from "@/lib/zodSchema";
import { UserPlus } from "lucide-react";
import Register from "../_components/Register";
import Login from "../_components/Login";
const LoginPage = () => {
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  function onSubmit(values: registerSchemaType) {
    console.log(values);
  }
  return (
    <section className="flex-1 justify-between flex items-center ">
      <div className="register flex items-center justify-center flex-1  p-2">
        <Register />
      </div>
      <div className=" flex-1 p-2 flex items-center justify-center">
        <Login />
      </div>
    </section>
  );
};

export default LoginPage;
