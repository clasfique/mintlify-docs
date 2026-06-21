#!/usr/bin/env node

const fs = require('node:fs/promises');
const matter = require('gray-matter');

async function processMarkdownFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(fileContent);

    // (3) If it has a `title` property in the front matter, do nothing and exit
    if (frontmatter.title) {
      console.error(`File '${filePath}' already has a title in its frontmatter. Exiting.`);
      return;
    }

    // Find the first non-empty line to check for a heading
    const lines = body.trim().split('\n');
    const firstLineIndex = lines.findIndex(line => line.startsWith('#'));
    const firstLine = firstLineIndex !== -1 ? lines[firstLineIndex].trim() : null;

    if (!firstLine) {
        console.error(`No heading found at the beginning of the body in '${filePath}'. Exiting.`);
        return;
    }

    // (5) if the first heading is anything other than a `h1`
    if (firstLine.indexOf('# ') !== 0) {
      // (5a) throw an error and exit
      throw new Error(`Error in '${filePath}': The first heading is not a h1.`);
    }

    // (6) if the first heading is a `h1`
    // (6a) add the heading to the front matter as a `title` property
    const title = firstLine.substring(2).trim();
    frontmatter.title = title;

    // (6b) remove the heading from the markdown body
    lines.splice(firstLineIndex, 1);
    const updatedBody = lines.join('\n');

    // (6c) write updated file to disk, overwriting input file
    const updatedFileContent = matter.stringify(updatedBody, frontmatter);
    await fs.writeFile(filePath, updatedFileContent);
    console.log(`Updated '${filePath}': added title '${title}' to frontmatter and removed h1 from body.`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Please provide the path to a markdown file.');
  process.exit(1);
}
processMarkdownFile(inputFile);
