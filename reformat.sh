#!/bin/bash
# reformats from gitbook's MD format to mintlify's MDX format

SCRIPTS_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
echo "SCRIPTS_DIR=${SCRIPTS_DIR}"
export SCRIPTS_DIR
DIR=$( cd -- "${SCRIPTS_DIR}/../.gitbook" &> /dev/null && pwd )
# DIR=${SCRIPTS_DIR}
# # DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/../scripts" &> /dev/null && pwd )
echo "editing syntax for all .mdx files in dir: ${DIR}"

edit_file() {
    echo "===processing MDX==="
    echo "${1}";
    sed -i '' \
        -e 's/{% hint style="\([a-zA-Z0-9-]*\)" %}/<Callout icon="\1" color="#07C1FF" iconType="regular">/g' \
        -e 's/{% endhint %}/<\/Callout>/g' \
        -e 's/<br>/<br \/>/g' \
        -e 's/{% tabs %}/<Tabs>/g' \
        -e 's/{% endtabs %}/<\/Tabs>/g' \
        -e 's/{% tab title="\(.*\)" %}/<Tab title="\1">/g' \
        -e 's/{% endtab %}/<\/Tab>/g' \
        -e 's/{% embed url="\(.*\)" %}/<iframe src="\1" className="w-full h-96 rounded-xl"><\/iframe>/g' \
        "${1}"
        # \[([^\]]+)\]\((?!https?:\/\/)([^\)"]+)\/README\.md\s+("[^"\)]+")\)  [$1]($2/ $3)
        # \[([^\]]+)\]\((?!https?:\/\/)([^\)]+)([^\)]+)/README\.md\)  [$1]($2/)
        # \[([^\]]+)\]\((?!https?:\/\/)([^\)]+)\.md\s+("[^"]+")\) [$1]($2/ $3)
        # \[([^\]]+)\]\((?!https?:\/\/)([^\)]+)\.md\)  [$1]($2/)
        # \[([^\]]+)\]\((?!(?:\.\.\/|\.\/|http))([^\)]+)\.md\) [$1](./$2/)
        # \[([^\]]+)\]\((?!https?:\/\/)([^\)]+)\.md#([^\)]+)\)  [$1]($2/#$3)
        # \[([^\]]+)\]\((?!(?:#|\.\.\/|\.\/|http|mailto))([^\)"]+)\)  [$1](./$2)
        # \[([^\]]+)\]\((?!(?:#|\.\.\/|\.\/|http|mailto))([^\)"]+)\s+("[^"]+")\)  [$1](./$2 $3)
        # (?:\.\.?\/)*\.gitbook\/assets\/(.*?)\.png  /img/$1.png
    
    ${SCRIPTS_DIR}/title-updater.js "${1}"
}
export -f edit_file

find "${DIR}" -iname '*.mdx' -type f -print0 | \
    sort -z -u | \
    xargs -0 -r -n 1 -P 4 bash -c 'edit_file "$@"' _
