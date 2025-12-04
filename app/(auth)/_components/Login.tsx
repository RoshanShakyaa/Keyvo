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
import { loginSchema, loginSchemaType } from "@/lib/zodSchema";
import { Github, LogIn } from "lucide-react";
import { useForm } from "react-hook-form";
import z from "zod";
import { Separator } from "@/components/ui/separator";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
const Login = () => {
  const [loginPending, startLoginTransition] = useTransition();
  const [githubPending, startGithubTransition] = useTransition();
  const [googlePending, startGoogleTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function signInWithGithub() {
    startGithubTransition(async () => {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
          },
          onError: () => {
            console.error("Failed to login with Github: ");
          },
        },
      });
    });
  }

  function signInWithGoogle() {
    startGoogleTransition(async () => {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
          },
          onError: () => {
            console.error("Failed to login with Google: ");
          },
        },
      });
    });
  }

  function onSubmit(values: loginSchemaType) {
    startLoginTransition(async () => {
      const { email, password } = values;

      await authClient.signIn.email({
        email,
        password,
        fetchOptions: {
          onSuccess: () => {
            form.reset();
            router.push("/");
          },
          onError: (err) => {
            console.error("Login failed", err);
          },
        },
      });
    });
  }

  return (
    <div className=" w-[300px]">
      <Form {...form}>
        <div className="flex mb-2 gap-1 items-center">
          <LogIn className="size-5 " />
          <p>Login</p>
        </div>
        <div className="flex w-full gap-2 mb-2">
          <Button
            onClick={signInWithGoogle}
            disabled={googlePending}
            className="flex-1"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="100"
              height="100"
              viewBox="0 0 50 50"
            >
              <path
                fill="white"
                d="M 25.996094 48 C 13.3125 48 2.992188 37.683594 2.992188 25 C 2.992188 12.316406 13.3125 2 25.996094 2 C 31.742188 2 37.242188 4.128906 41.488281 7.996094 L 42.261719 8.703125 L 34.675781 16.289063 L 33.972656 15.6875 C 31.746094 13.78125 28.914063 12.730469 25.996094 12.730469 C 19.230469 12.730469 13.722656 18.234375 13.722656 25 C 13.722656 31.765625 19.230469 37.269531 25.996094 37.269531 C 30.875 37.269531 34.730469 34.777344 36.546875 30.53125 L 24.996094 30.53125 L 24.996094 20.175781 L 47.546875 20.207031 L 47.714844 21 C 48.890625 26.582031 47.949219 34.792969 43.183594 40.667969 C 39.238281 45.53125 33.457031 48 25.996094 48 Z"
              ></path>
            </svg>
          </Button>
          <Button
            onClick={signInWithGithub}
            disabled={githubPending}
            className="flex-1"
          >
            <Github className="size-5" />
          </Button>
        </div>
        <Separator className="my-4" />
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
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
          <Button disabled={loginPending} className="w-full mt-2" type="submit">
            <LogIn className="size-4 " />
            <span>Login</span>
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default Login;
