'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function deleteBlog(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('blogs')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error('Failed to delete blog: ' + error.message);
  }

  revalidatePath('/admin/blogs');
  revalidatePath('/staff/blogs');
  revalidatePath('/blog');
}

export async function createBlog(formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const published = formData.get('published') === 'true';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  const { error } = await supabase
    .from('blogs')
    .insert({
      title,
      content,
      author_id: user.id,
      published,
    });

  if (error) {
    throw new Error('Failed to create blog: ' + error.message);
  }

  const basePath = profile?.role === 'admin' ? '/admin/blogs' : '/staff/blogs';
  revalidatePath(basePath);
  revalidatePath('/blog');
  redirect(basePath);
}

export async function updateBlog(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const published = formData.get('published') === 'true';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  const { error } = await supabase
    .from('blogs')
    .update({
      title,
      content,
      published,
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to update blog: ' + error.message);
  }

  const basePath = profile?.role === 'admin' ? '/admin/blogs' : '/staff/blogs';
  revalidatePath(basePath);
  revalidatePath('/blog');
  redirect(basePath);
}
