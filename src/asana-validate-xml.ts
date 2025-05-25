import { JSDOM } from 'jsdom';

/**
 * Defines the validation rules based on the provided Asana rich text example.
 */
const asanaRichTextRules = {
    // All tags observed in the example
    allowedTags: new Set([
        'body', 'strong', 'em', 'u', 's', 'a', 'code', 'pre',
        'blockquote', 'ul', 'li', 'ol', 'h1', 'h2', 'table',
        'tr', 'td', 'hr', 'img'
    ]),

    // Tags observed with attributes in the example
    tagsWithAllowedAttributes: new Set(['a', 'img', 'td']),

    // Specific attributes allowed per tag, based on the example
    allowedAttributes: {
        a: new Set([
            'href', 'data-asana-gid', 'data-asana-accessible',
            'data-asana-type', 'data-asana-dynamic',
        ]),
        img: new Set([
            'src', 'data-asana-gid', 'data-asana-type',
            'data-src-height', 'data-src-width',
            'data-thumbnail-url', 'data-thumbnail-height', 'data-thumbnail-width',
            'alt', 'style',
        ]),
        td: new Set(['width', 'data-cell-widths']),
    } as Record<string, Set<string>>, // Type assertion for indexing

    // Tags that must be empty (cannot contain any nodes, even text)
    emptyTags: new Set(['hr', 'img']),

    // Defines allowed direct child ELEMENT tags for specific parents.
    // Text nodes are allowed unless the parent is explicitly restricted below
    // (e.g., ul, ol, table, tr only allow specific elements).
    allowedChildElementTags: {
        body: new Set([
            'strong', 'em', 'u', 's', 'a', 'code', 'pre', 'blockquote',
            'ul', 'ol', 'h1', 'h2', 'table', 'hr', 'img'
        ]),
        ul: new Set(['li']),
        ol: new Set(['li']),
        li: new Set(['strong', 'em', 'u', 's', 'a', 'code', 'ul', 'ol']),
        blockquote: new Set([ // Allows lists, pre, and inline formatting
            'ul', 'ol', 'pre', 'strong', 'em', 'u', 's', 'a', 'code'
        ]),
        pre: new Set<string>(), // No child ELEMENTS allowed
        h1: new Set<string>(), // No child ELEMENTS allowed
        h2: new Set<string>(), // No child ELEMENTS allowed
        table: new Set(['tr']), // Note: No thead/tbody/tfoot seen in example
        tr: new Set(['td']),    // Note: No th seen in example
        td: new Set(['strong', 'em', 'u', 's', 'a', 'code']), // Allows inline formatting
        // Inline tags can nest each other and contain 'a'/'code'
        strong: new Set(['em', 'u', 's', 'a', 'code', 'strong']), // Allow self-nesting? Example doesn't show, but often allowed. Be strict: remove 'strong' if needed.
        em: new Set(['strong', 'u', 's', 'a', 'code', 'em']),
        u: new Set(['strong', 'em', 's', 'a', 'code', 'u']),
        s: new Set(['strong', 'em', 'u', 'a', 'code', 's']),
        a: new Set(['strong', 'em', 'u', 's', 'code']), // Links can contain formatting
        code: new Set<string>(), // No child ELEMENTS allowed
    } as Record<string, Set<string>>,

    // --- Specific structural rules (e.g., required parent) ---
    // Based on standard HTML structure and example
    structuralRules: {
        li: { requiredParents: new Set(['ul', 'ol']) },
        tr: { requiredParents: new Set(['table']) }, // Assuming no thead/tbody based on example
        td: { requiredParents: new Set(['tr']) },
    },

    // Tags that explicitly DISALLOW non-whitespace text nodes as direct children
    disallowedDirectTextChildren: new Set([
      'ul', 'ol', 'table', 'tr'
    ]),
};

// Helper function to check if a node is a non-empty text node
function isNonEmptyTextNode(node: Node): boolean {
    // Node.TEXT_NODE === 3
    return node.nodeType === 3 && !!node.nodeValue?.trim();
}

/**
 * Validates an XML string based on Asana's rich text rules derived from the provided example.
 *
 * @param xmlString The XML string input (should be wrapped in <body>).
 * @returns An array of error messages. Returns an empty array if the XML is valid.
 */
export function validateAsanaXml(xmlString: string): string[] {
    const errors: string[] = [];

    // --- 1. Basic Checks ---
    if (!xmlString || typeof xmlString !== 'string' ) {
        // Allow empty string if it represents an empty body, check later
         if (xmlString === null || xmlString === undefined) {
             return ['Input XML string cannot be null or undefined.'];
         }
         // Allow empty string - it's technically parsable as empty document
    }
     if (xmlString.trim() === '') {
         return ['Input XML string cannot be just whitespace. Use <body></body> for empty content.'];
     }


    // --- 2. Parsing ---
    let dom: JSDOM;
    try {
        // Use 'text/xml' for stricter parsing (case-sensitive, etc.)
        dom = new JSDOM(xmlString, { contentType: 'text/xml' });
    } catch (e: any) {
        // Catch errors during initial parsing (e.g., invalid chars)
        return [`Failed to parse XML: ${e.message}`];
    }

    // Check for explicit parser errors reported by the parser within the DOM
    const parserError = dom.window.document.querySelector('parsererror');
    if (parserError) {
        const errorDetails = parserError.textContent?.split('\n')[1]?.trim() || parserError.textContent?.trim();
        return [`XML is not well-formed: ${errorDetails || 'Parser error detected.'}`];
    }

    const document = dom.window.document;
    const rootElement = document.documentElement;

    // --- 3. Root Element ---
    if (!rootElement) {
        // Handles empty input string after trimming check
        return ['XML document is empty or lacks a root element. Must start with <body>.'];
    }
    if (rootElement.tagName !== 'body') {
        return [`Root element must be <body>, but found <${rootElement.tagName}>.`];
        // Stop validation if root is wrong
    }

    // Use a Set to avoid duplicate error messages for the exact same issue/node combination
    const reportedErrors = new Set<string>();
    const addError = (message: string) => {
        if (!reportedErrors.has(message)) {
            errors.push(message);
            reportedErrors.add(message);
        }
    };

    // --- 4. Recursive Validation Function ---
    function validateNode(node: Element, lineage: string) {
        const tagName = node.tagName;
        const currentLineage = `${lineage} > ${tagName}`;

        // --- 4a. Check Allowed Tag ---
        if (!asanaRichTextRules.allowedTags.has(tagName)) {
            addError(`Unsupported tag found: <${tagName}> at ${lineage}`);
            return; // Don't validate children/attributes of unsupported tags
        }

        // --- 4b. Check Attributes ---
        const attributes = node.attributes;
        for (let i = 0; i < attributes.length; i++) {
            const attr = attributes[i];
            const attrName = attr.name;
            const errorMsgContext = `on tag <${tagName}> at ${currentLineage}`;

            // Is the tag allowed to have *any* attributes?
            if (!asanaRichTextRules.tagsWithAllowedAttributes.has(tagName)) {
                addError(`Tag <${tagName}> does not support attributes, but found '${attrName}' ${errorMsgContext}`);
                continue; // Check next attribute
            }

            // Is this *specific* attribute allowed for this tag?
            const allowedAttrsForTag = asanaRichTextRules.allowedAttributes[tagName];
            if (!allowedAttrsForTag || !allowedAttrsForTag.has(attrName)) {
                addError(`Unsupported attribute '${attrName}' found ${errorMsgContext}`);
            }
            // Future: Add attribute value validation here if needed (e.g., URLs, GID format)
             if (attrName === 'href' && !attr.value) {
                 addError(`Attribute 'href' cannot be empty ${errorMsgContext}`);
             }
             // Add more specific value checks if required
        }

        // --- 4c. Check Empty Tags ---
        if (asanaRichTextRules.emptyTags.has(tagName)) {
            // Check if it actually contains any element or non-whitespace text nodes
             let hasContent = false;
             node.childNodes.forEach(child => {
                 if (child.nodeType === 1 || (child.nodeType === 3 && child.nodeValue?.trim())) {
                     hasContent = true;
                 }
             });
             if(hasContent) {
                 addError(`Tag <${tagName}> must be empty but contains content at ${currentLineage}`);
             }
        }

        // --- 4d. Check Specific Structural Rules (Required Parent) ---
        const structuralRule = asanaRichTextRules.structuralRules[tagName as keyof typeof asanaRichTextRules.structuralRules];
        if (structuralRule?.requiredParents) {
            const parent = node.parentElement;
            if (!parent || !structuralRule.requiredParents.has(parent.tagName)) {
                const parentTagName = parent ? `<${parent.tagName}>` : 'document root';
                const expectedParents = Array.from(structuralRule.requiredParents).map(p => `<${p}>`).join(' or ');
                addError(`Tag <${tagName}> at ${currentLineage} must be a direct child of ${expectedParents}, but its parent is ${parentTagName}.`);
            }
        }

        // --- 4e. Validate Children (Elements and Text) ---
        const allowedChildElementsSet = asanaRichTextRules.allowedChildElementTags[tagName as keyof typeof asanaRichTextRules.allowedChildElementTags];
        const allowDirectText = !asanaRichTextRules.disallowedDirectTextChildren.has(tagName);
        const parentAllowsAnyChildElement = allowedChildElementsSet === undefined; // If undefined in rules, assume any allowed tag is ok (applies to blockquote, td, etc.)

        node.childNodes.forEach(childNode => {
            // Validate Element Nodes
            if (childNode.nodeType === 1 /* Node.ELEMENT_NODE */) {
                const childElement = childNode as Element;
                const childTagName = childElement.tagName;

                // Check if the PARENT restricts this child ELEMENT tag
                if (!parentAllowsAnyChildElement && !allowedChildElementsSet.has(childTagName)) {
                    addError(`Tag <${childTagName}> is not allowed as a direct child of <${tagName}> at ${currentLineage}`);
                } else if (!asanaRichTextRules.allowedTags.has(childTagName)) {
                    // If parent allows *any* allowed tag, still check child is actually allowed *globally*
                    // This handles cases where a tag like `<td>` might implicitly allow children,
                    // but we still need to ensure those children (`<strong>`, etc.) are valid Asana tags.
                    // This error might be redundant if the recursive call catches it, but belt-and-suspenders.
                    // Error added in recursive call is usually better with full lineage.
                    // addError(`Unsupported tag found: <${childTagName}> as child of <${tagName}> at ${currentLineage}`);
                }

                // Recursively validate the child element
                validateNode(childElement, currentLineage);
            }
            // Validate Text Nodes
            else if (isNonEmptyTextNode(childNode)) {
                if (!allowDirectText) {
                    // Check if this parent tag explicitly disallows direct text children
                     addError(`Text content ("${childNode.nodeValue?.trim().substring(0, 20)}...") found directly inside <${tagName}> at ${currentLineage}, which is not allowed.`);
                } else if (allowedChildElementsSet?.size === 0 && tagName !== 'code' && tagName !== 'pre' && tagName !== 'h1' && tagName !== 'h2') {
                    // Check cases like <code>, <pre>, <h1>, <h2> which allow text but *no elements*
                    // If allowedChildElementsSet is empty, but it's not one of the text-only tags, it's likely an error in rules or input.
                    // This case might not be strictly necessary if element check catches things first.
                }
            }
        });
    }

    // --- 5. Start Validation ---
    validateNode(rootElement, 'body'); // Start recursion

    return errors;
}
