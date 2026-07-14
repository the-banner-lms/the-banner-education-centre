const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setCoverImages() {
  const { data: albums, error } = await supabase.from('albums').select('*');
  if (error) {
    console.error('Error fetching albums:', error);
    return;
  }

  for (const album of albums) {
    if (!album.cover_image_url) {
      // Find the first photo in this album
      const { data: media, error: mediaError } = await supabase
        .from('activities_media')
        .select('*')
        .eq('album_id', album.id)
        .eq('media_type', 'photo')
        .order('created_at', { ascending: true })
        .limit(1);
      
      if (mediaError) {
        console.error('Error fetching media for album', album.title, mediaError);
        continue;
      }

      if (media && media.length > 0) {
        const coverUrl = media[0].url;
        console.log(`Setting cover for ${album.title} to ${coverUrl}`);
        
        const { error: updateError } = await supabase
          .from('albums')
          .update({ cover_image_url: coverUrl })
          .eq('id', album.id);
          
        if (updateError) {
          console.error('Error updating cover for album', album.title, updateError);
        }
      }
    }
  }
  console.log('Done updating cover images.');
}

setCoverImages();
