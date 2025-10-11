import fse from 'fs-extra';
import path from 'node:path';

import { dim } from 'kleur/colors';

export interface SaveOptions {
  ignoreCache?: boolean;
  log?: (message: string) => void;
  tag?: (type: 'download' | 'cached') => void;
}

export const VIRTUAL_CONTENT_ROOT = 'src/content/notion';

/**
 * Downloads and saves an image from an AWS URL to a local directory.
 *
 * @param url The AWS URL of the image to download.
 * @param dir The directory path where the image will be saved.
 * @param options Optional configuration for saving the image.
 * @param options.ignoreCache Whether to ignore cached images and download again. Defaults to false.
 * @param options.log Optional logging function to record the operation.
 * @param options.tag Optional tagging function to mark the operation as 'download' or 'cached'.
 *
 * @returns The relative path of the saved image from the project's virtual content root.
 *
 * @throws {Error} If the provided `url` is invalid.
 *
 * @example
 * For the following AWS URL:
 * https://prod-files-secure.s3.us-west-2.amazonaws.com/ed3b245b-dd96-4e0d-a399-9a99a0cf37c0/d16195b7-f998-4b7c-8d2e-38b9c47be295/image.png?...
 *
 * The function parses the URL into:
 * - Parent ID: ed3b245b-dd96-4e0d-a399-9a99a0cf37c0
 * - Object ID: d16195b7-f998-4b7c-8d2e-38b9c47be295
 * - File Name: image.png
 *
 * And saves it to:
 * ./src/{dir}/ed3b245b-dd96-4e0d-a399-9a99a0cf37c0/d16195b7-f998-4b7c-8d2e-38b9c47be295.png
 */
export async function saveImageFromAWS(url: string, dir: string, options: SaveOptions = {}) {
  const { ignoreCache, log, tag } = options;

  const contentRootAbs = path.resolve(process.cwd(), VIRTUAL_CONTENT_ROOT);
  const dirAbs = path.resolve(process.cwd(), dir);
  if (!fse.existsSync(dirAbs)) fse.ensureDirSync(dirAbs);
  if (!dirAbs.startsWith(contentRootAbs + path.sep) && dirAbs !== contentRootAbs) {
    throw new Error(`Target dir must be within ${VIRTUAL_CONTENT_ROOT}`);
  }

  // Validate and parse the URL
  let parsed: URL;
  try {
    parsed = new URL(typeof url === 'string' ? url : String((url as any)?.url ?? ''));
  } catch {
    throw new Error('Invalid URL');
  }
  const [parentId, objId, fileName] = parsed.pathname.split('/').filter(Boolean); // Remove empty strings

  if (!fileName || !parentId || !objId) {
    throw new Error('Invalid URL');
  }

  // Path to parent directory of the image
  // ./src/{dir}/{parentId}
  const saveDirPath = path.resolve(dir, parentId);
  fse.ensureDirSync(saveDirPath);

  const ext = fileName.split('.').at(-1);

  // Path to the image file
  // ./src/{dir}/{parentId}/{objId}.{ext}
  const filePath = path.resolve(saveDirPath, `${objId}.${ext}`);

  if (ignoreCache || !fse.existsSync(filePath)) {
    // If ignoreCache is true or the file doesn't exist, download it
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      await fse.writeFile(filePath, new Uint8Array(buffer));

      log?.(`Saved image \`${fileName}\` ${dim(`created \`${filePath}\``)}`);
      tag?.('download');
    } catch (error: unknown) {
      // Clean up any partial file that might have been created
      if (fse.existsSync(filePath)) {
        fse.removeSync(filePath);
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Timeout downloading image: ${fileName}`);
        }
        throw new Error(`Failed to download image \`${fileName}\`: ${error.message}`);
      }
      throw new Error(`Unknown error downloading image: ${fileName}`);
    }
  } else {
    log?.(`Skipped caching image \`${fileName}\` ${dim(`cached at \`${filePath}\``)}`);
    tag?.('cached');
  }

  const relBasePath = contentRootAbs;

  // Relative path of the image from the virtual content root
  const rel = path.relative(relBasePath, filePath);
  if (rel.startsWith('..')) throw new Error('Resolved image path escaped content root');
  return rel.split(path.sep).join('/');
}

/**
 * Transforms a raw image path into a relative path from the 'src' directory.
 */
export function transformImagePathForCover(rawPath: string): string {
  const contentRootAbs = path.resolve(process.cwd(), VIRTUAL_CONTENT_ROOT);
  const srcAbs = path.resolve(process.cwd(), 'src');
  
  // get abs path from relative path to VIRTUAL_CONTENT_ROOT
  const absPath = path.resolve(contentRootAbs, rawPath);
  
  // Ensure the resolved path is within the content root
  if (!absPath.startsWith(contentRootAbs + path.sep) && absPath !== contentRootAbs) {
    throw new Error(`Image path escaped content root: ${rawPath}`);
  }
  
  const rel = path.relative(srcAbs, absPath);
  if (rel.startsWith('..')) throw new Error('Resolved image path escaped src directory');
  return rel.split(path.sep).join('/');
}
