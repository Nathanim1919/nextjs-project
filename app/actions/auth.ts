'use server'

import { z } from 'zod'
import {
  verifyPassword,
  createSession,
  createUser,
  deleteSession,
} from '@/lib/auth'
import { getUserByEmail } from '@/lib/dal'
import { mockDelay } from '@/lib/utils'
import { redirect } from 'next/navigation'

// Define Zod schema for signin validation
const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Define Zod schema for signup validation
const SignUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignInData = z.infer<typeof SignInSchema>
export type SignUpData = z.infer<typeof SignUpSchema>

export type ActionResponse = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  error?: string
}


export const signin = async (formData: FormData): Promise<ActionResponse> => {
  try {
    // add a small delay to simulate  network latency
    await mockDelay(700)

    // Extract data from form
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    // validate with Zod
    const validationResult = SignInSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success:false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      }
    }


    const user = await getUserByEmail(data.email);
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: {
          email: ['Invalid email or password'],
        }
      }
    }


    const isPasswordValid = await verifyPassword(data.password, user.password);
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: {
          email: ['Invalid email or password'],
        }
      }
    }


    await createSession(user.id);
    return {
      success: true,
      message: 'Signed in successfully',
    }
  } catch (error) {
    console.log(error)
    return {
      success: false,
      message: 'Something went wrong',
    }
  }
}


export const signup = async (formData: FormData): Promise<ActionResponse> => {
  try {
       // add a small delay to simulate  network latency
       await mockDelay(700)

       // Extract data from form
       const data = {
         email: formData.get('email') as string,
         password: formData.get('password') as string,
         confirmPassword: formData.get('confirmPassword') as string,
       }


       const validationResult = SignUpSchema.safeParse(data);

       if (!validationResult.success){
          return {
            success: false,
            message: 'Validation failed',
            errors: validationResult.error.flatten().fieldErrors,
          }
       }

      const user = await createUser(data.email, data.password);


      if (!user) {
        return {
          success: false,
          message: 'try again',
          error: 'failed to create user',
        }
      }


      await createSession(user.id);
      return {
        success: true,
        message: 'Account created successfully',
      }

  } catch (error) {
    console.log("Sign up errors:",error)
    return {
      success: false,
      message: "An error occured while creating your account",
      error:"Failed to create account"
    }
  }
} 


export const signout = async () => {
  try {
    await deleteSession();
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    redirect('/signin');
  }
}