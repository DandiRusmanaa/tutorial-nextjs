'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import bcrypt from 'bcrypt';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const CreateInvoiceSchema = z.object({
  customerId: z.string({ invalid_type_error: 'Please select a customer.' }),
  amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], { required_error: 'Please select an invoice status.' }),
});

const UpdateInvoiceSchema = CreateInvoiceSchema.extend({
  date: z.string().optional(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State | undefined, formData: FormData) {
  const parsed = CreateInvoiceSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  const { customerId, amount, status } = parsed.data;
  const amountInCents = Math.round(amount * 100);
  const date = new Date().toISOString().split('T')[0];

  try {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Create Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State | undefined, formData: FormData) {
  const parsed = UpdateInvoiceSchema.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    date: formData.get('date'),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = parsed.data;
  const amountInCents = Math.round(amount * 100);

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string, formData: FormData) {
  try {
    await sql`
      DELETE FROM invoices WHERE id = ${id}
    `;
  } catch (err) {
    throw new Error('Database Error: Failed to delete invoice.');
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function authenticate(prevState: State | undefined, formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard';

  if (typeof email !== 'string' || typeof password !== 'string') {
    return { message: 'Missing credentials.' };
  }

  try {
    const users = await sql<any[]>`SELECT * FROM users WHERE email = ${email}`;

    // If user doesn't exist, create it (per request) and log in immediately
    if (users.length === 0) {
      const hashed = await bcrypt.hash(password, 10);
      await sql`INSERT INTO users (email, password, name) VALUES (${email}, ${hashed}, ${email.split('@')[0]})`;
      redirect(redirectTo);
      return;
    }

    const user = users[0];
    const passwordsMatch = await bcrypt.compare(password, user.password);
    if (!passwordsMatch) {
      return { message: 'Invalid email or password.' };
    }

    // Successful login
    redirect(redirectTo);
    return;
  } catch (err) {
    console.error('Authentication error:', err);
    return { message: 'Authentication error.' };
  }
}
