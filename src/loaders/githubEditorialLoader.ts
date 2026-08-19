import type { Loader } from 'astro/loaders';
import {
  loadEditorialManifestSource,
  loadEditorialMarkdownEntry,
  parseMarkdownDocument,
} from '~/utils/frequency-editorial';

export function githubEditorialLoader(): Loader {
  return {
    name: 'github-editorial-loader',
    load: async context => {
      const source = await loadEditorialManifestSource();

      if (!source) {
        context.store.clear();
        context.logger.warn(
          'No editorial manifest found. Check network access or set FREQUENCY_LOCAL_EXPORT_DIR for local development.'
        );
        return;
      }

      context.store.clear();

      for (const item of source.manifest.items) {
        try {
          const { raw, fileUrl } = await loadEditorialMarkdownEntry(source, item.path);
          const { frontmatter, body } = parseMarkdownDocument(raw);
          const parsedData = await context.parseData({
            id: item.slug,
            data: frontmatter,
          });
          const rendered = await context.renderMarkdown(body, {
            fileURL: source.mode === 'local' ? fileUrl : undefined,
          });
          context.store.set({
            id: item.slug,
            data: parsedData,
            body,
            digest: context.generateDigest(raw),
            rendered,
          });
        } catch (err) {
          context.logger.error(
            `Failed to load editorial entry "${item.slug}": ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }
    },
  };
}
