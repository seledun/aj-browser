export const dynamic = 'force-dynamic';

import fs from 'fs';
import path from 'path';
import ArchiveTable from './_components/ArchiveTable';

export default function ArchivePage() {
  const dirPath = '/app/public/archives';
  let files: any[] = [];

  try {
    if (fs.existsSync(dirPath)) {
      const filenames = fs.readdirSync(dirPath);
      files = filenames.map((file) => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: (stats.size / (1024 * 1024)).toFixed(2),
          createdAt: stats.birthtime.toLocaleDateString(), // Serialize date for Client Component
          href: `/archives/${file}`,
        };
      });
      files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch (e) {
    console.error(e);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold mb-4">Archive</h1>
      <ArchiveTable files={files} />
    </div>
  );
}