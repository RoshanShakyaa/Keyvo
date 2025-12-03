"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { registerSchema, registerSchemaType } from "@/lib/zodSchema";
import { Loader, UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import { useTransition } from "react";
import { signUpAction } from "../actions/auth";
import { useRouter } from "next/navigation";
const Register = () => {
  const [resgisterPending, startRegisterTransition] = useTransition();
  const router = useRouter();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  function onSubmit(values: registerSchemaType) {
    startRegisterTransition(async () => {
      const result = await signUpAction(values);
      if (result.status === "success") {
        form.reset();
        router.push("/");
        return;
      }
    });
  }

  return (
    <div className="w-[300px]">
      <Form {...form}>
        <div className="flex mb-2 gap-1 items-center">
          <UserPlus className="size-5 " />
          <p>Register</p>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="username" {...field} type="text" />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="email" {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="password" {...field} type="password" />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="verify password"
                    {...field}
                    type="password"
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            disabled={resgisterPending}
            className="w-full mt-2"
            type="submit"
          >
            {resgisterPending ? (
              <>
                <Loader className="animate-spin size-4" />{" "}
              </>
            ) : (
              <>
                <UserPlus className="size-4 " />
                Register
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default Register;
