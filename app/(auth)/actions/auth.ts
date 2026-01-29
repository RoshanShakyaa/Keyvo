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
  values: registerSchemaType,
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

    // Step 1: Register the user
    await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return {
      message: "Registered successfully",
      status: "success",
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      message: "Something went wrong",
      status: "error",
    };
  }
}

export async function signInAction(
  values: loginSchemaType,
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
  } catch (error) {
    console.error("Login error:", error);
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
