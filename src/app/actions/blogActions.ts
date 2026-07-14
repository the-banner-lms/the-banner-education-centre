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
  const tagsString = formData.get('tags') as string || '';
  const tags = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);

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
      tags,
    });

  if (error) {
    throw new Error('Failed to create post: ' + error.message);
  }

  const basePath = profile?.role === 'admin' ? '/admin/blogs' : '/staff/blogs';
  revalidatePath(basePath);
  revalidatePath('/blog');
}

export async function updateBlog(id: string, formData: FormData) {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const published = formData.get('published') === 'true';
  const tagsString = formData.get('tags') as string || '';
  const tags = tagsString.split(',').map(t => t.trim()).filter(t => t.length > 0);

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
      tags,
    })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to update post: ' + error.message);
  }

  const basePath = profile?.role === 'admin' ? '/admin/blogs' : '/staff/blogs';
  revalidatePath(basePath);
  revalidatePath('/blog');
}

export async function toggleBlogStatus(id: string, published: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();

  const { error } = await supabase
    .from('blogs')
    .update({ published })
    .eq('id', id);

  if (error) {
    throw new Error('Failed to update status: ' + error.message);
  }

  const basePath = profile?.role === 'admin' ? '/admin/blogs' : '/staff/blogs';
  revalidatePath(basePath);
  revalidatePath('/blog');
}
