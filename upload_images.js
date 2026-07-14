const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const baseDir = '/Users/thureinminn/Data/Blog/the-banner-education-centre/images /Site Images';

function generateCaption(filename, albumName) {
  let name = path.basename(filename, path.extname(filename));
  
  if (name.toLowerCase().startsWith('img')) {
    return `${albumName} Photo ${name.replace(/img/i, '').trim()}`;
  }
  if (name.toLowerCase().startsWith('photo_')) {
    return `${albumName} Moment`;
  }
  
  name = name.replace(/[-_]/g, ' ');
  name = name.replace(/\((\d+)\)/g, ' $1');
  name = name.replace(/\b\w/g, c => c.toUpperCase());
  return name.trim();
}

async function uploadImages() {
  console.log('Starting image upload and sync...');
  const items = fs.readdirSync(baseDir);

  for (const item of items) {
    const itemPath = path.join(baseDir, item);
    const stat = fs.statSync(itemPath);

    if (item === 'Site Images' || item.startsWith('.') || item.endsWith('.zip')) {
      continue;
    }

    if (stat.isDirectory()) {
      console.log(`\nProcessing Album: ${item}`);
      
      let { data: album } = await supabase.from('albums').select('id, title').eq('title', item).single();

      if (!album) {
        const res = await supabase.from('albums').insert({ title: item }).select('id, title').single();
        if (res.error) continue;
        album = res.data;
      }

      const files = fs.readdirSync(itemPath);
      for (const file of files) {
        if (file.startsWith('.')) continue;
        const filePath = path.join(itemPath, file);
        if (!fs.statSync(filePath).isFile()) continue;

        const fileExt = path.extname(file).toLowerCase();
        if (!['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(fileExt)) continue;

        // Use deterministic filename to prevent storage orphans
        const fileName = `${album.id}/${file.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        // Check if already exists in DB
        const { data: existing } = await supabase.from('activities_media').select('id').eq('album_id', album.id).like('url', `%${fileName}`).limit(1);
        if (existing && existing.length > 0) {
          console.log(`  Already exists in DB: ${file}`);
          continue;
        }

        console.log(`  Uploading: ${file}...`);
        const fileContent = fs.readFileSync(filePath);

        const { error: uploadError } = await supabase.storage.from('activities').upload(fileName, fileContent, { 
          contentType: `image/${fileExt.replace('.', '')}`,
          upsert: true 
        });
        
        if (uploadError) {
          console.error(`  Error uploading ${file}:`, uploadError.message);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from('activities').getPublicUrl(fileName);
        const caption = generateCaption(file, album.title);

        const { error: dbError } = await supabase.from('activities_media').insert({
          album_id: album.id,
          media_type: 'photo',
          url: publicUrl,
          caption: caption
        });

        if (dbError) {
          console.error(`  Error inserting ${file} to DB:`, dbError.message);
        } else {
          console.log(`  Success: ${file}`);
        }
      }
    }
  }

  // Handle loose files
  const looseFiles = items.filter(i => {
    if (i === 'Site Images' || i.startsWith('.') || i.endsWith('.zip')) return false;
    const p = path.join(baseDir, i);
    return fs.statSync(p).isFile() && ['.png', '.jpg', '.jpeg'].includes(path.extname(i).toLowerCase());
  });

  if (looseFiles.length > 0) {
    console.log(`\nProcessing loose images into 'Miscellaneous' album...`);
    let { data: album } = await supabase.from('albums').select('id, title').eq('title', 'Miscellaneous').single();
    if (!album) {
      const res = await supabase.from('albums').insert({ title: 'Miscellaneous' }).select('id, title').single();
      album = res.data;
    }
    
    for (const file of looseFiles) {
      const filePath = path.join(baseDir, file);
      const fileExt = path.extname(file).toLowerCase();
      
      const fileName = `${album.id}/${file.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: existing } = await supabase.from('activities_media').select('id').eq('album_id', album.id).like('url', `%${fileName}`).limit(1);
      if (existing && existing.length > 0) {
        console.log(`  Already exists in DB: ${file}`);
        continue;
      }

      console.log(`  Uploading: ${file}...`);
      const fileContent = fs.readFileSync(filePath);

      const { error: uploadError } = await supabase.storage.from('activities').upload(fileName, fileContent, { 
        contentType: `image/${fileExt.replace('.', '')}`,
        upsert: true 
      });
      if (uploadError) continue;
      const { data: { publicUrl } } = supabase.storage.from('activities').getPublicUrl(fileName);
      
      const caption = generateCaption(file, album.title);

      await supabase.from('activities_media').insert({ album_id: album.id, media_type: 'photo', url: publicUrl, caption: caption });
      console.log(`  Success: ${file}`);
    }
  }

  console.log('\nAll done!');
}

uploadImages();
