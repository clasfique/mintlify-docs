#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');
const gitbookParsers = require('gitbook-parsers');

const SUMMARY_PATH = '../.gitbook/SUMMARY.md';
const DOCS_JSON_PATH = '../.gitbook/docs.json';
const MV_COMMANDS_PATH = '../scripts/mv-commands.sh';

const mvCommands = [
    'mkdir -p redirects/',
];
const undoMvCommands = [
    'rm -rf redirects/*.mdx',
];

function processGitbookItem(item) {
    let result;
    if (item.path) {
        // remove file extension if present
        let toFilePath;
        if (item.path.match(/^https?\:/)) {
            // this is a URL, which gitbook supports in the nav menu ... but mintlify does not
            // so the workaround is to create an empty MDX file and then have that redirect
            const urlSlug = item.path
                .replace(/[^A-Za-z0-9]+/g, '_')
                .replace(/_$/g, '');
            const redirectFile = `redirects/${urlSlug}.mdx`;
            mvCommands.push(
                `cat << EOF > ${redirectFile}
---
title: "${item.title}"
url: "${item.path}"
---
EOF`
            );
            undoMvCommands.push(`rm redirects/${urlSlug}.mdx`);
            return `redirects/${urlSlug}`;
        } else if (item.path.match(/\/README\.md$/)) {
            toFilePath = item.path.replace(/\/README\.md$/, '/index.mdx');
            result = toFilePath.replace(/\.mdx$/, '');
        } else if (item.path.match(/\.md$/)) {
            toFilePath = item.path.replace(/\.md$/, '.mdx');
            result = toFilePath.replace(/\.mdx$/, '');
        }
        if (toFilePath) {
            mvCommands.push(`git mv ${fromFilePath} ${toFilePath}`);
            undoMvCommands.push(`git mv ${toFilePath} ${fromFilePath}`);
        }
        result = result || item.path.replace(/(\/README)?\.(md|mdx)$/, '');
    }
    return result;
}

// recursively process the GitBook SUMMARY.md
// and restructures it for Mintlify's docs.json 
function processGitbookSummary(items) {
    return items.map((item) => {
        if (item.title === 'Wallet') {
            console.log(item);
        }
        let mintlifyItem;

        const itemResult = processGitbookItem(item);
        if (!item.articles || item.articles.length === 0) {
            mintlifyItem = itemResult;
        } else {
            mintlifyItem = {
                group: item.title,
                pages: [
                    itemResult,
                ],
            };
            mintlifyItem.pages = [
                ...mintlifyItem.pages,
                ...(processGitbookSummary(item.articles)),
            ];
        }
        return mintlifyItem;
    });
}

async function convertSummaryToDocsJson(inputPath, outputPath, mvCommandsOutputPath) {
    try {
        const summaryContent = await fs.readFile(inputPath, 'utf8');

        // use gitbook-parsers to parse the SUMMARY.md format
        const parser = gitbookParsers.getForFile(path.basename(inputPath));
        const gitbookSummary = await parser.summary(summaryContent);

        const mintlifyNavigation = processGitbookSummary(gitbookSummary.chapters);
        
        // object to be serialised into Mintlify docs.json
        const mintlifyDocs = {
            "$schema": "https://mintlify.com/docs.json",
            "theme": "mint",
            "name": "Injective Docs",
            "colors": {
                "primary": "#004D9D",
                "light": "#29A19C",
                "dark": "#0D1821"
            },
            "styling": {
                "eyebrows": "breadcrumbs"
            },
            // "logo": {
            //     "dark": "/logo/logo-dark.svg",
            //     "light": "/logo/logo-light.svg"
            // },
            navigation: {
                groups: [
                    {
                        "group": "Injective",
                        pages: mintlifyNavigation,
                    },
                ],
            },
        };

        await fs.writeFile(outputPath, JSON.stringify(mintlifyDocs, null, 2), 'utf8');

        console.log(`Successfully converted ${inputPath} to ${outputPath}`);

        const mvCommandsScript = '#!/bin/sh\n\n' + mvCommands.join('\n');
        await fs.writeFile(mvCommandsOutputPath, mvCommandsScript, 'utf8');
        console.log(`Wrote mv commands to ${mvCommandsOutputPath}`);

        const undoMvCommandsScript = '#!/bin/sh\n\n' + undoMvCommands.join('\n');
        const undoMvCommandsOutputPath = mvCommandsOutputPath.replace(/\.sh$/, '-undo.sh');
        await fs.writeFile(undoMvCommandsOutputPath, undoMvCommandsScript, 'utf8');
        console.log(`Wrote undo mv commands to ${undoMvCommandsOutputPath}`);
    } catch (error) {
        console.error('Error during conversion:', error);
    }
}

// run
convertSummaryToDocsJson(SUMMARY_PATH, DOCS_JSON_PATH, MV_COMMANDS_PATH);
