'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const allowedTargetRoles = new Set(['all', 'admin', 'staff', 'teacher', 'student']);

export async function createAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // Get user profile to check role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return { error: 'Forbidden' };
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const target_role = formData.get('target_role') as string || 'all';

  if (!title || !content) {
    return { error: 'Title and content are required' };
  }

  if (!allowedTargetRoles.has(target_role)) {
    return { error: 'Invalid target role' };
  }

  const { error } = await supabase.from('announcements').insert({
    title,
    content,
    target_role,
    author_id: user.id,
    author_role: profile.role,
  });

  if (error) {
    console.error('Error creating announcement:', error);
    return { error: error.message };
  }

  revalidatePath('/announcements');
  revalidatePath('/admin/announcements');
  revalidatePath('/staff/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/teacher');
  revalidatePath('/staff');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateAnnouncement(id: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  // Verify ownership or admin
  const { data: announcement } = await supabase.from('announcements').select('author_id').eq('id', id).single();
  if (!announcement) return { error: 'Not found' };

  if (profile?.role !== 'admin' && announcement.author_id !== user.id) {
    return { error: 'Forbidden' };
  }

  const title = formData.get('title') as string;
  const content = formData.get('content') as string;
  const target_role = formData.get('target_role') as string || 'all';

  if (!allowedTargetRoles.has(target_role)) {
    return { error: 'Invalid target role' };
  }

  const { error } = await supabase.from('announcements').update({
    title,
    content,
    target_role,
    updated_at: new Date().toISOString()
  }).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/announcements');
  revalidatePath(`/announcements/${id}`);
  revalidatePath('/admin/announcements');
  revalidatePath('/staff/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/teacher');
  revalidatePath('/staff');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function deleteAnnouncement(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  
  const { data: announcement } = await supabase.from('announcements').select('author_id').eq('id', id).single();
  if (!announcement) return { error: 'Not found' };

  if (profile?.role !== 'admin' && announcement.author_id !== user.id) {
    return { error: 'Forbidden' };
  }

  const { error } = await supabase.from('announcements').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/announcements');
  revalidatePath('/admin/announcements');
  revalidatePath('/staff/announcements');
  revalidatePath('/dashboard');
  revalidatePath('/teacher');
  revalidatePath('/staff');
  revalidatePath('/admin');
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function createReply(announcementId: string, content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  if (!content || !content.trim()) return { error: 'Reply content cannot be empty' };

  const { error } = await supabase.from('announcement_replies').insert({
    announcement_id: announcementId,
    user_id: user.id,
    content,
  });

  if (error) {
    console.error('Error creating reply:', error);
    return { error: error.message };
  }

  revalidatePath(`/announcements/${announcementId}`);
  return { success: true };
}

export async function deleteReply(replyId: string, announcementId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const { data: reply } = await supabase.from('announcement_replies').select('user_id').eq('id', replyId).single();
  
  if (!reply) return { error: 'Not found' };

  if (profile?.role !== 'admin' && reply.user_id !== user.id) {
    return { error: 'Forbidden' };
  }

  const { error } = await supabase.from('announcement_replies').delete().eq('id', replyId);
  if (error) return { error: error.message };

  revalidatePath(`/announcements/${announcementId}`);
  return { success: true };
}

export async function markAnnouncementAsRead(announcementId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase.from('announcement_reads').upsert(
    { user_id: user.id, announcement_id: announcementId, read_at: new Date().toISOString() },
    { onConflict: 'user_id, announcement_id' }
  );

  if (error) {
    console.error('Error marking as read:', error);
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}
