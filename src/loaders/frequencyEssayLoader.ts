import type { Loader } from 'astro/loaders';
import { loadEssayManifestSource, loadEssayMarkdownEntry } from '~/utils/frequency-essays';
import { parseMarkdownDocument } from '~/utils/frequency-markdown';

export function frequencyEssayLoader(): Loader {
  return {
    name: 'frequency-essay-loader',
    load: async context => {
      const source = await loadEssayManifestSource();

      if (!source) {
        context.logger.warn(
          'No essay manifest found. Check network access or set FREQUENCY_LOCAL_EXPORT_DIR for local development.'
        );
        return;
      }

      for (const item of source.manifest.items) {
        try {
          const { raw, fileUrl } = await loadEssayMarkdownEntry(source, item.path);
          const { frontmatter, body } = parseMarkdownDocument(raw);
          const parsedData = await context.parseData({
            id: `essay/${item.slug}`,
            data: frontmatter,
          });
          const rendered = await context.renderMarkdown(body, {
            fileURL: source.mode === 'local' ? fileUrl : undefined,
          });
          context.store.set({
            id: `essay/${item.slug}`,
            data: parsedData,
            body,
            digest: context.generateDigest(raw),
            rendered,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          context.logger.error(`Failed to load essay ${item.slug}: ${message}`);
        }
      }
    },
  };
}
