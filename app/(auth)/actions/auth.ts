"use server";

import { auth } from "@/lib/auth";
import { ApiResponse } from "@/lib/types";
import {
  loginSchema,
  loginSchemaType,
  registerSchema,
  registerSchemaType,
} from "@/lib/zodSchema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signUpAction(
  values: registerSchemaType
): Promise<ApiResponse> {
  try {
    const result = registerSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }
    const email = result.data?.email;
    const password = result.data?.password;
    const name = result.data?.username;

    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    return {
      message: "Register successful",
      status: "success",
    };
  } catch {
    return {
      message: "Something went wrong",
      status: "error",
    };
  }
}
export async function signInAction(
  values: loginSchemaType
): Promise<ApiResponse> {
  try {
    const result = loginSchema.safeParse(values);
    if (!result.success) {
      return {
        message: "Invalid data",
        status: "error",
      };
    }
    const email = result.data.email;
    const password = result.data.password;

    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    redirect("/");
  } catch {
    return {
      status: "error",
      message: "Something went wrong",
    };
  }
}

export async function signOutAction() {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/");
}
